const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { pool } = require('../config/mysql');
const { validate } = require('../middleware/validate');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

const processPaymentSchema = z.object({
  challanId: z.number().int().positive(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['ONLINE_GATEWAY', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'CASH_COUNTER']),
  transactionReference: z.string().min(3)
});

router.use(authenticateToken, requireRoles('PAYMENT_ADMIN', 'TRAFFIC_ADMIN'));

// View outstanding challans (from View v_outstanding_challans)
router.get('/outstanding', async (req, res, next) => {
  try {
    const search = (req.query.search || '').trim();
    const filterOverdue = req.query.overdue === 'true';

    let sql = 'SELECT * FROM v_outstanding_challans';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(challan_number LIKE ? OR registration_no LIKE ? OR owner_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (filterOverdue) {
      conditions.push('days_overdue > 0');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY due_date ASC';

    const [rows] = await pool.execute(sql, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

// Process Counter / Offline Payment via sp_process_payment
router.post('/process', validate(processPaymentSchema), async (req, res, next) => {
  try {
    const { challanId, amount, paymentMethod, transactionReference } = req.body;

    await pool.execute(
      'CALL sp_process_payment(?, ?, ?, ?)',
      [challanId, amount, paymentMethod, transactionReference]
    );

    const [paymentRecord] = await pool.execute(
      'SELECT receipt_number, payment_date, amount_paid FROM payment WHERE challan_id = ? AND transaction_reference = ?',
      [challanId, transactionReference]
    );

    res.json({
      success: true,
      data: {
        message: 'Payment recorded and challan marked PAID via sp_process_payment',
        receipt: paymentRecord[0] || null
      }
    });
  } catch (err) {
    next(err);
  }
});

// Batch late fee application via sp_apply_late_fees
router.post('/apply-late-fees', async (req, res, next) => {
  try {
    const asOfDate = req.body.asOfDate || new Date().toISOString().split('T')[0];

    // Call stored procedure sp_apply_late_fees
    await pool.execute('CALL sp_apply_late_fees(?)', [asOfDate]);

    // Count how many are now overdue
    const [stats] = await pool.execute(
      "SELECT COUNT(*) AS overdue_count, IFNULL(SUM(late_fee), 0.00) AS total_late_fees FROM challan WHERE status = 'OVERDUE'"
    );

    res.json({
      success: true,
      data: {
        message: `Late fee batch run successfully for as_of_date: ${asOfDate}`,
        stats: stats[0]
      }
    });
  } catch (err) {
    next(err);
  }
});

// Payments history
router.get('/history', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        p.payment_id,
        p.challan_id,
        p.amount_paid,
        p.payment_date,
        p.payment_method,
        p.transaction_reference,
        p.gateway_status,
        p.receipt_number,
        c.challan_number,
        v.registration_no,
        o.name AS owner_name
       FROM payment p
       JOIN challan c ON p.challan_id = c.challan_id
       JOIN violation viol ON c.violation_id = viol.violation_id
       JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
       JOIN owner o ON v.owner_id = o.owner_id
       ORDER BY p.payment_date DESC
       LIMIT 100`
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

// Monthly collection report
router.get('/monthly-report', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') AS month_label,
        payment_method,
        COUNT(payment_id) AS transaction_count,
        SUM(amount_paid) AS total_collected
       FROM payment
       WHERE gateway_status = 'SUCCESS'
       GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), payment_method
       ORDER BY month_label DESC`
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
