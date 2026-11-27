const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { pool } = require('../config/mysql');
const { validate } = require('../middleware/validate');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const { EvidenceMetadata } = require('../models/EvidenceModel');

const decideAppealSchema = z.object({
  decision: z.enum(['ACCEPTED', 'REJECTED']),
  remarks: z.string().min(5, 'Review remarks must be at least 5 characters')
});

router.use(authenticateToken, requireRoles('APPEAL_OFFICER', 'TRAFFIC_ADMIN'));

// Appeals queue (Pending, Accepted, Rejected)
router.get('/queue', async (req, res, next) => {
  try {
    const statusFilter = req.query.status || 'PENDING';

    let sql = `
      SELECT 
        a.appeal_id,
        a.challan_id,
        a.reason,
        a.appeal_date,
        a.status AS appeal_status,
        a.decision_date,
        a.officer_remarks,
        c.challan_number,
        c.total_amount,
        c.due_date,
        v.registration_no,
        v.make_model,
        o.name AS owner_name,
        o.phone AS owner_phone,
        vt.title AS violation_title,
        vt.section_act,
        off.name AS reviewing_officer_name
      FROM appeal a
      JOIN challan c ON a.challan_id = c.challan_id
      JOIN violation viol ON c.violation_id = viol.violation_id
      JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
      JOIN owner o ON v.owner_id = o.owner_id
      JOIN violation_type vt ON viol.violation_type_id = vt.violation_type_id
      LEFT JOIN officer off ON a.reviewing_officer_id = off.officer_id`;

    const params = [];
    if (statusFilter !== 'ALL') {
      sql += ' WHERE a.status = ?';
      params.push(statusFilter);
    }

    sql += ' ORDER BY a.appeal_date ASC';

    const [rows] = await pool.execute(sql, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

// Single appeal detail with evidence gallery
router.get('/:appealId', async (req, res, next) => {
  try {
    const appealId = parseInt(req.params.appealId, 10);

    const [rows] = await pool.execute(
      `SELECT 
        a.appeal_id,
        a.challan_id,
        a.reason,
        a.appeal_date,
        a.status AS appeal_status,
        a.decision_date,
        a.officer_remarks,
        c.challan_number,
        c.fine_amount,
        c.late_fee,
        c.total_amount,
        c.issue_date,
        c.due_date,
        c.status AS challan_status,
        c.appeal_window_end,
        viol.violation_id,
        viol.violation_timestamp,
        viol.speed_recorded,
        viol.remarks AS violation_remarks,
        v.registration_no,
        v.make_model,
        v.vehicle_type,
        o.name AS owner_name,
        o.phone AS owner_phone,
        vt.title AS violation_title,
        vt.section_act,
        loc.area_name,
        loc.junction_name,
        rec_off.name AS recording_officer_name,
        rec_off.badge_number AS recording_officer_badge
       FROM appeal a
       JOIN challan c ON a.challan_id = c.challan_id
       JOIN violation viol ON c.violation_id = viol.violation_id
       JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
       JOIN owner o ON v.owner_id = o.owner_id
       JOIN violation_type vt ON viol.violation_type_id = vt.violation_type_id
       JOIN location loc ON viol.location_id = loc.location_id
       JOIN officer rec_off ON viol.officer_id = rec_off.officer_id
       WHERE a.appeal_id = ?`,
      [appealId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Appeal not found' });
    }

    const appealData = rows[0];

    // Fetch Evidence metadata from MongoDB & MySQL
    const [sqlEvidence] = await pool.execute(
      'SELECT * FROM evidence WHERE violation_id = ?',
      [appealData.violation_id]
    );

    let mongoEvidence = [];
    try {
      mongoEvidence = await EvidenceMetadata.find({ violation_id: appealData.violation_id }).lean();
    } catch (e) {
      console.warn('MongoDB error:', e.message);
    }

    res.json({
      success: true,
      data: {
        appeal: appealData,
        evidence: {
          sql: sqlEvidence,
          mongo: mongoEvidence
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// Decide appeal via sp_decide_appeal
router.post('/:appealId/decide', validate(decideAppealSchema), async (req, res, next) => {
  try {
    const appealId = parseInt(req.params.appealId, 10);
    const { decision, remarks } = req.body;
    const officerId = req.user.officer_id || 2;
    const today = new Date().toISOString().split('T')[0];

    await pool.execute(
      'CALL sp_decide_appeal(?, ?, ?, ?, ?)',
      [appealId, officerId, decision, remarks, today]
    );

    res.json({
      success: true,
      data: {
        message: `Appeal #${appealId} decided as '${decision}' via sp_decide_appeal. Challan status updated accordingly.`
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
