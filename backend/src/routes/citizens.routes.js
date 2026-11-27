const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { pool } = require('../config/mysql');
const { validate } = require('../middleware/validate');
const { optionalAuth } = require('../middleware/authMiddleware');
const { EvidenceMetadata } = require('../models/EvidenceModel');
const { generateReceiptPdf } = require('../services/pdfService');

const payChallanSchema = z.object({
  challanId: z.number().int().positive(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['ONLINE_GATEWAY', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING']),
  transactionReference: z.string().min(5),
  simulateFailure: z.boolean().optional().default(false)
});

const appealSchema = z.object({
  challanId: z.number().int().positive(),
  reason: z.string().min(10, 'Reason must be at least 10 characters long')
});

// Citizen Search (Publicly accessible)
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a Vehicle Registration Number (e.g., DL01AB1234) or Challan Number.'
      });
    }

    const [rows] = await pool.execute(
      `SELECT 
        c.challan_id,
        c.challan_number,
        c.fine_amount,
        c.late_fee,
        c.total_amount,
        c.issue_date,
        c.due_date,
        c.status,
        c.appeal_window_end,
        v.registration_no,
        v.make_model,
        v.vehicle_type,
        o.name AS owner_name,
        vt.title AS violation_title,
        vt.section_act,
        loc.area_name,
        loc.junction_name,
        viol.violation_timestamp,
        p.receipt_number,
        p.payment_date
       FROM challan c
       JOIN violation viol ON c.violation_id = viol.violation_id
       JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
       JOIN owner o ON v.owner_id = o.owner_id
       JOIN violation_type vt ON viol.violation_type_id = vt.violation_type_id
       JOIN location loc ON viol.location_id = loc.location_id
       LEFT JOIN payment p ON c.challan_id = p.challan_id AND p.gateway_status = 'SUCCESS'
       WHERE c.challan_number = ? OR v.registration_no = ?
       ORDER BY c.issue_date DESC`,
      [q, q]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

// Challan details with timeline, evidence, and audit trail
router.get('/challan/:challanId', optionalAuth, async (req, res, next) => {
  try {
    const challanId = parseInt(req.params.challanId, 10);

    const [challans] = await pool.execute(
      `SELECT 
        c.challan_id,
        c.challan_number,
        c.violation_id,
        c.fine_amount,
        c.late_fee,
        c.total_amount,
        c.issue_date,
        c.due_date,
        c.status,
        c.appeal_window_end,
        c.version,
        c.created_at,
        c.updated_at,
        v.vehicle_id,
        v.registration_no,
        v.make_model,
        v.vehicle_type,
        v.color,
        v.chassis_no,
        v.engine_no,
        v.rc_status,
        o.name AS owner_name,
        o.phone AS owner_phone,
        o.email AS owner_email,
        vt.title AS violation_title,
        vt.section_act,
        vt.description AS violation_description,
        vt.severity,
        vt.demerit_points,
        loc.area_name,
        loc.junction_name,
        loc.latitude,
        loc.longitude,
        loc.speed_limit,
        viol.violation_timestamp,
        viol.speed_recorded,
        viol.remarks AS officer_remarks,
        off.name AS recording_officer_name,
        off.badge_number AS recording_officer_badge,
        off.police_station,
        p.payment_id,
        p.amount_paid,
        p.payment_date,
        p.payment_method,
        p.transaction_reference,
        p.receipt_number,
        app.appeal_id,
        app.reason AS appeal_reason,
        app.appeal_date,
        app.status AS appeal_status,
        app.officer_remarks AS appeal_review_remarks,
        app.decision_date AS appeal_decision_date
       FROM challan c
       JOIN violation viol ON c.violation_id = viol.violation_id
       JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
       JOIN owner o ON v.owner_id = o.owner_id
       JOIN violation_type vt ON viol.violation_type_id = vt.violation_type_id
       JOIN location loc ON viol.location_id = loc.location_id
       JOIN officer off ON viol.officer_id = off.officer_id
       LEFT JOIN payment p ON c.challan_id = p.challan_id AND p.gateway_status = 'SUCCESS'
       LEFT JOIN appeal app ON c.challan_id = app.challan_id
       WHERE c.challan_id = ?`,
      [challanId]
    );

    if (challans.length === 0) {
      return res.status(404).json({ success: false, error: 'Challan record not found' });
    }

    const challan = challans[0];

    // Fetch Evidence metadata from MySQL & MongoDB
    const [sqlEvidence] = await pool.execute(
      'SELECT evidence_id, media_type, storage_path, mongo_evidence_id, captured_at, file_size_kb FROM evidence WHERE violation_id = ?',
      [challan.violation_id]
    );

    let mongoEvidence = [];
    try {
      mongoEvidence = await EvidenceMetadata.find({ violation_id: challan.violation_id }).lean();
    } catch (e) {
      console.warn('MongoDB query notice:', e.message);
    }

    // Fetch Audit Trail for lifecycle verification
    const [auditLogs] = await pool.execute(
      'SELECT audit_id, old_status, new_status, old_amount, new_amount, action, performed_by, timestamp FROM challan_audit WHERE challan_id = ? ORDER BY timestamp ASC',
      [challanId]
    );

    // Build timeline events
    const timeline = [
      {
        step: 1,
        title: 'Violation Detected & Logged',
        timestamp: challan.violation_timestamp,
        status: 'COMPLETED',
        description: `Recorded by Officer ${challan.recording_officer_name} (${challan.recording_officer_badge}) at ${challan.junction_name}`
      },
      {
        step: 2,
        title: 'E-Challan Issued',
        timestamp: challan.issue_date,
        status: 'COMPLETED',
        description: `Official Challan #${challan.challan_number} issued for INR ${challan.fine_amount}`
      }
    ];

    if (challan.status === 'PAID') {
      timeline.push({
        step: 3,
        title: 'Payment Completed',
        timestamp: challan.payment_date,
        status: 'COMPLETED',
        description: `Paid INR ${challan.amount_paid} via ${challan.payment_method}. Receipt #${challan.receipt_number}`
      });
    } else if (challan.status === 'APPEALED') {
      timeline.push({
        step: 3,
        title: 'Grievance / Appeal Filed',
        timestamp: challan.appeal_date,
        status: challan.appeal_status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED',
        description: `Appeal Status: ${challan.appeal_status}. Reason: ${challan.appeal_reason}`
      });
    } else if (challan.status === 'CANCELLED') {
      timeline.push({
        step: 3,
        title: 'Challan Revoked / Cancelled',
        timestamp: challan.appeal_decision_date || challan.updated_at,
        status: 'COMPLETED',
        description: 'Challan penalty waived after review.'
      });
    } else if (challan.status === 'OVERDUE') {
      timeline.push({
        step: 3,
        title: 'Payment Overdue - Late Surcharge Levied',
        timestamp: challan.due_date,
        status: 'WARNING',
        description: `Payment deadline expired. Late fee of INR ${challan.late_fee} added.`
      });
    }

    res.json({
      success: true,
      data: {
        challan,
        timeline,
        evidence: {
          sql: sqlEvidence,
          mongo: mongoEvidence
        },
        auditLogs
      }
    });
  } catch (err) {
    next(err);
  }
});

// Citizen Pay Online (Invokes Stored Procedure sp_process_payment)
router.post('/pay', validate(payChallanSchema), async (req, res, next) => {
  try {
    const { challanId, amount, paymentMethod, transactionReference, simulateFailure } = req.body;

    if (simulateFailure) {
      return res.status(402).json({
        success: false,
        error: 'Simulated Payment Gateway Error: Insufficient funds or bank authorization declined.'
      });
    }

    // Call stored procedure sp_process_payment
    await pool.execute(
      'CALL sp_process_payment(?, ?, ?, ?)',
      [challanId, amount, paymentMethod, transactionReference]
    );

    // Fetch updated record with receipt
    const [payments] = await pool.execute(
      'SELECT receipt_number, payment_date, amount_paid FROM payment WHERE challan_id = ? AND transaction_reference = ?',
      [challanId, transactionReference]
    );

    res.json({
      success: true,
      data: {
        message: 'Payment processed successfully via sp_process_payment',
        receipt: payments[0] || null
      }
    });
  } catch (err) {
    next(err);
  }
});

// Citizen File Appeal (Invokes Stored Procedure sp_file_appeal)
router.post('/appeal', validate(appealSchema), async (req, res, next) => {
  try {
    const { challanId, reason } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Call stored procedure sp_file_appeal
    await pool.execute(
      'CALL sp_file_appeal(?, ?, ?)',
      [challanId, reason, today]
    );

    res.json({
      success: true,
      data: {
        message: 'Grievance appeal filed successfully via sp_file_appeal. Pending review by adjudication officer.'
      }
    });
  } catch (err) {
    next(err);
  }
});

// Download PDF Receipt
router.get('/receipt/:challanId/pdf', async (req, res, next) => {
  try {
    const challanId = parseInt(req.params.challanId, 10);

    const [rows] = await pool.execute(
      `SELECT 
        c.challan_id,
        c.challan_number,
        c.fine_amount,
        c.late_fee,
        c.total_amount,
        v.registration_no,
        v.make_model,
        v.vehicle_type,
        v.chassis_no,
        o.name AS owner_name,
        o.phone AS owner_phone,
        vt.title AS violation_title,
        vt.section_act,
        loc.area_name,
        loc.junction_name,
        p.receipt_number,
        p.amount_paid,
        p.payment_date,
        p.payment_method,
        p.transaction_reference
       FROM challan c
       JOIN violation viol ON c.violation_id = viol.violation_id
       JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
       JOIN owner o ON v.owner_id = o.owner_id
       JOIN violation_type vt ON viol.violation_type_id = vt.violation_type_id
       JOIN location loc ON viol.location_id = loc.location_id
       LEFT JOIN payment p ON c.challan_id = p.challan_id AND p.gateway_status = 'SUCCESS'
       WHERE c.challan_id = ?`,
      [challanId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Challan record not found' });
    }

    const challanData = rows[0];
    const pdfBuffer = await generateReceiptPdf(challanData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${challanData.challan_number}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
