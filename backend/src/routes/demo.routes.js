const express = require('express');
const router = express.Router();
const { pool, callProcedureWithOut } = require('../config/mysql');
const { optionalAuth } = require('../middleware/authMiddleware');

router.use(optionalAuth);

// Helper to snapshot database state for side-by-side comparison
async function getDbSnapshot() {
  const [v] = await pool.execute('SELECT COUNT(*) AS total FROM violation');
  const [c] = await pool.execute('SELECT COUNT(*) AS total FROM challan');
  const [p] = await pool.execute('SELECT COUNT(*) AS total FROM payment');
  const [a] = await pool.execute('SELECT COUNT(*) AS total FROM challan_audit');
  return {
    violations: v[0].total,
    challans: c[0].total,
    payments: p[0].total,
    auditLogs: a[0].total
  };
}

// 1. Transaction Atomicity Demo (COMMIT vs ROLLBACK)
router.post('/transaction', async (req, res, next) => {
  try {
    const simulateFailure = req.body.simulateFailure === true || req.body.simulateFailure === 'true';

    // Before Snapshot
    const beforeState = await getDbSnapshot();

    // Create a new fresh violation to run the atomic transaction on
    const [violationInsert] = await pool.execute(
      `INSERT INTO violation (vehicle_id, driver_id, violation_type_id, location_id, officer_id, violation_timestamp, remarks, status)
       VALUES (1, 1, 1, 1, 1, NOW(), 'VIVA LAB DEMO ATOMIC TRANSACTION', 'LOGGED')`
    );
    const violationId = violationInsert.insertId;

    const txnRef = 'TXN-DEMO-' + Date.now();
    const simFlag = simulateFailure ? 1 : 0;

    // Call stored procedure sp_violation_to_payment
    const result = await callProcedureWithOut(
      'CALL sp_violation_to_payment(?, ?, ?, ?, @out_res)',
      [violationId, 'UPI', txnRef, simFlag],
      '@out_res'
    );

    // After Snapshot
    const afterState = await getDbSnapshot();

    // Fetch the final record state of that violation & challan
    const [violRows] = await pool.execute(
      'SELECT violation_id, status FROM violation WHERE violation_id = ?',
      [violationId]
    );
    const [challanRows] = await pool.execute(
      'SELECT challan_id, challan_number, status, total_amount FROM challan WHERE violation_id = ?',
      [violationId]
    );

    res.json({
      success: true,
      data: {
        scenario: simulateFailure ? 'TRANSACTION_ROLLBACK' : 'TRANSACTION_COMMIT',
        result,
        simulateFailure,
        violationId,
        beforeState,
        afterState,
        violation: violRows[0] || null,
        challan: challanRows[0] || null,
        explanation: simulateFailure
          ? 'Rollback Demonstration: An intentional failure occurred during payment execution. MySQL rolled back the entire transaction. Notice that neither the Challan nor the Payment persisted!'
          : 'Commit Demonstration: All steps (Violation -> Challan -> Payment Settlement) executed and committed atomically in one single database transaction.'
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. Concurrency Race Condition Demo (Two Simultaneous Payments)
router.post('/concurrency', async (req, res, next) => {
  try {
    // 1. Create a fresh violation
    const [vResult] = await pool.execute(
      `INSERT INTO violation (vehicle_id, driver_id, violation_type_id, location_id, officer_id, violation_timestamp, remarks, status)
       VALUES (2, 2, 2, 3, 2, NOW(), 'CONCURRENCY RACE DEMO', 'LOGGED')`
    );
    const violationId = vResult.insertId;

    // 2. Generate a challan
    const challanId = await callProcedureWithOut(
      'CALL sp_generate_challan(?, @out_id)',
      [violationId],
      '@out_id'
    );

    // Fetch challan fine amount
    const [cRows] = await pool.execute(
      'SELECT total_amount FROM challan WHERE challan_id = ?',
      [challanId]
    );
    const amount = parseFloat(cRows[0].total_amount);

    const txnRef1 = `RACE-TXN-A-${Date.now()}`;
    const txnRef2 = `RACE-TXN-B-${Date.now()}`;

    // 3. Fire TWO simultaneous payment requests for the EXACT SAME challan
    const req1 = pool.execute('CALL sp_process_payment(?, ?, ?, ?)', [challanId, amount, 'UPI', txnRef1]);
    const req2 = pool.execute('CALL sp_process_payment(?, ?, ?, ?)', [challanId, amount, 'CREDIT_CARD', txnRef2]);

    const results = await Promise.allSettled([req1, req2]);

    const res1 = results[0];
    const res2 = results[1];

    // Check final status of challan in database
    const [finalChallan] = await pool.execute(
      'SELECT challan_id, challan_number, status, version FROM challan WHERE challan_id = ?',
      [challanId]
    );

    const [payments] = await pool.execute(
      'SELECT payment_id, amount_paid, payment_method, transaction_reference, receipt_number FROM payment WHERE challan_id = ?',
      [challanId]
    );

    res.json({
      success: true,
      data: {
        challanId,
        requestA: {
          client: 'Client A (Mobile UPI)',
          status: res1.status,
          success: res1.status === 'fulfilled',
          error: res1.status === 'rejected' ? (res1.reason.sqlMessage || res1.reason.message) : null
        },
        requestB: {
          client: 'Client B (Web Gateway)',
          status: res2.status,
          success: res2.status === 'fulfilled',
          error: res2.status === 'rejected' ? (res2.reason.sqlMessage || res2.reason.message) : null
        },
        finalChallan: finalChallan[0],
        paymentsRecorded: payments,
        concurrencyOutcome: payments.length === 1
          ? 'SUCCESS: Exactly ONE payment was processed. The duplicate concurrent request was safely blocked by pessimistic row lock (SELECT ... FOR UPDATE) and payment guard trigger.'
          : 'WARNING: Multiple payments recorded!'
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
