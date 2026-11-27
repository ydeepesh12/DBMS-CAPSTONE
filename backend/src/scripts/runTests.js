const { pool, callProcedureWithOut } = require('../config/mysql');

async function runTests() {
  console.log('====================================================');
  console.log('   Running SmartChallan Integration Test Suite     ');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log('✓ PASSED');
      passed++;
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`);
      failed++;
    }
  }

  // Test 1: Verify app_user roles exist
  await test('RBAC User Roles in Database', async () => {
    const [users] = await pool.execute('SELECT username, role FROM app_user');
    const roles = users.map(u => u.role);
    const expected = ['OFFICER', 'PAYMENT_ADMIN', 'APPEAL_OFFICER', 'TRAFFIC_ADMIN', 'MANAGEMENT', 'OWNER'];
    for (const exp of expected) {
      if (!roles.includes(exp)) {
        throw new Error(`Role ${exp} not found in app_user table`);
      }
    }
  });

  // Test 2: Generate Challan via sp_generate_challan
  let testChallanId = null;
  let fineAmount = 0;
  await test('Procedure: sp_generate_challan OUT parameter', async () => {
    // Insert fresh test violation
    const [v] = await pool.execute(
      `INSERT INTO violation (vehicle_id, driver_id, violation_type_id, location_id, officer_id, violation_timestamp, remarks, status)
       VALUES (1, 1, 2, 1, 1, NOW(), 'TEST SUITE VIOLATION', 'LOGGED')`
    );
    const vId = v.insertId;

    testChallanId = await callProcedureWithOut(
      'CALL sp_generate_challan(?, @out_id)',
      [vId],
      '@out_id'
    );

    if (!testChallanId) throw new Error('sp_generate_challan failed to return challan_id');

    const [c] = await pool.execute('SELECT fine_amount, total_amount, status FROM challan WHERE challan_id = ?', [testChallanId]);
    if (c[0].status !== 'UNPAID') throw new Error(`Expected UNPAID, got ${c[0].status}`);
    fineAmount = parseFloat(c[0].total_amount);
  });

  // Test 3: Wrong amount rejection (422)
  await test('Procedure: Reject Wrong Payment Amount', async () => {
    try {
      await pool.execute('CALL sp_process_payment(?, ?, ?, ?)', [testChallanId, fineAmount + 500, 'UPI', 'TXN-FAIL-AMOUNT']);
      throw new Error('Expected procedure to reject mismatched payment amount');
    } catch (err) {
      if (!err.message.includes('Payment amount does not match') && !err.message.includes('Payment rejected')) {
        throw err;
      }
    }
  });

  // Test 4: Payment Success
  const txnSuccess = 'TXN-TEST-PASS-' + Date.now();
  await test('Procedure: sp_process_payment Success', async () => {
    await pool.execute('CALL sp_process_payment(?, ?, ?, ?)', [testChallanId, fineAmount, 'UPI', txnSuccess]);
    const [c] = await pool.execute('SELECT status FROM challan WHERE challan_id = ?', [testChallanId]);
    if (c[0].status !== 'PAID') throw new Error(`Expected status PAID, got ${c[0].status}`);
  });

  // Test 5: Re-payment on already-paid challan rejection (409)
  await test('Procedure: Reject Duplicate Payment on Paid Challan', async () => {
    try {
      await pool.execute('CALL sp_process_payment(?, ?, ?, ?)', [testChallanId, fineAmount, 'UPI', 'TXN-DUPLICATE-TRY']);
      throw new Error('Expected procedure to reject payment on already paid challan');
    } catch (err) {
      if (!err.message.includes('already been paid') && !err.message.includes('already PAID')) {
        throw err;
      }
    }
  });

  // Test 6: Concurrency double payment race condition
  await test('Concurrency: Double payment on single challan', async () => {
    // Create new violation and challan
    const [v] = await pool.execute(
      `INSERT INTO violation (vehicle_id, driver_id, violation_type_id, location_id, officer_id, violation_timestamp, remarks, status)
       VALUES (1, 1, 3, 1, 1, NOW(), 'RACE TEST VIOLATION', 'LOGGED')`
    );
    const cid = await callProcedureWithOut('CALL sp_generate_challan(?, @out_id)', [v.insertId], '@out_id');
    const [c] = await pool.execute('SELECT total_amount FROM challan WHERE challan_id = ?', [cid]);
    const amt = parseFloat(c[0].total_amount);

    const [resA, resB] = await Promise.allSettled([
      pool.execute('CALL sp_process_payment(?, ?, ?, ?)', [cid, amt, 'UPI', `TXN-RACE-A-${Date.now()}`]),
      pool.execute('CALL sp_process_payment(?, ?, ?, ?)', [cid, amt, 'CARD', `TXN-RACE-B-${Date.now()}`])
    ]);

    const successes = [resA, resB].filter(r => r.status === 'fulfilled').length;
    const rejections = [resA, resB].filter(r => r.status === 'rejected').length;

    if (successes !== 1 || rejections !== 1) {
      throw new Error(`Expected exactly 1 success and 1 rejection, got ${successes} successes and ${rejections} rejections`);
    }
  });

  // Test 7: Rollback Demo
  await test('Atomicity: sp_violation_to_payment Rollback Simulation', async () => {
    const [v] = await pool.execute(
      `INSERT INTO violation (vehicle_id, driver_id, violation_type_id, location_id, officer_id, violation_timestamp, remarks, status)
       VALUES (1, 1, 1, 1, 1, NOW(), 'ROLLBACK TEST', 'LOGGED')`
    );
    const vId = v.insertId;

    const result = await callProcedureWithOut(
      'CALL sp_violation_to_payment(?, ?, ?, ?, @out_res)',
      [vId, 'UPI', 'TXN-ROLLBACK-' + Date.now(), 1], // simulate_failure = 1
      '@out_res'
    );

    if (result !== 'ROLLED_BACK_SIMULATED_FAILURE') {
      throw new Error(`Expected ROLLED_BACK_SIMULATED_FAILURE, got ${result}`);
    }

    // Verify challan was rolled back and not persisted
    const [c] = await pool.execute('SELECT * FROM challan WHERE violation_id = ?', [vId]);
    if (c.length > 0) throw new Error('Transaction failed to roll back challan record');
  });

  console.log('====================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');
}

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Test Suite Failed:', err);
      process.exit(1);
    });
}

module.exports = { runTests };
