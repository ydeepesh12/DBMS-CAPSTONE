const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
require('../config/loadEnv')();

const { seedMongoEvidence } = require('../../../traffic_challan_dbms/07_mongodb_evidence');

async function runSetup() {
  console.log('==================================================');
  console.log('  SmartChallan Database Setup & Migration Script  ');
  console.log('==================================================');

  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || 'root';

  console.log(`[MySQL] Connecting to MySQL server at ${host}:${port} as ${user}...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    console.log('[MySQL] Connection established.');
  } catch (err) {
    console.error('[MySQL] FAILED to connect:', err.message);
    console.log('[MySQL] Please ensure MySQL is running and MYSQL_PASSWORD in .env is correct.');
    process.exit(1);
  }

  const scriptsDir = path.join(__dirname, '../../../traffic_challan_dbms');
  const filesToExecute = [
    '01_schema.sql',
    '02_views_functions_triggers.sql',
    '03_procedures.sql',
    '04_sample_data.sql',
    '09_app_user.sql'
  ];

  for (const file of filesToExecute) {
    const filePath = path.join(scriptsDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[MySQL] Warning: File not found: ${filePath}`);
      continue;
    }

    console.log(`[MySQL] Executing: ${file}...`);
    let sqlContent = fs.readFileSync(filePath, 'utf8');

    // Split custom delimiters (DELIMITER $$ ... DELIMITER ;) for stored procedures/triggers
    // We clean up DELIMITER tokens for mysql2 multipleStatements
    sqlContent = sqlContent
      .replace(/DELIMITER\s+\$\$/gi, '')
      .replace(/DELIMITER\s+;/gi, '')
      .replace(/\$\$/g, ';');

    try {
      await connection.query(sqlContent);
      console.log(`[MySQL] ✓ Successfully executed ${file}`);
    } catch (sqlErr) {
      console.error(`[MySQL] ✗ Error executing ${file}:`, sqlErr.message);
    }
  }

  await connection.end();
  console.log('[MySQL] All SQL migrations finished.');

  // Setup MongoDB Evidence Data
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/traffic_challan';
  console.log(`[MongoDB] Connecting to ${mongoUri}...`);
  try {
    await mongoose.connect(mongoUri);
    await seedMongoEvidence();
    console.log('[MongoDB] ✓ Seeded evidence metadata collection.');
    await mongoose.disconnect();
  } catch (mErr) {
    console.warn('[MongoDB] Notice:', mErr.message);
  }

  // Ensure uploads directory exists and copy placeholder images
  const uploadDir = path.join(__dirname, '../../uploads/evidence');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Create lightweight SVG placeholders for test evidence
  const dummySvg = (text) => `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1e293b"/>
  <rect x="20" y="20" width="560" height="360" fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="8 8"/>
  <text x="300" y="160" fill="#f8fafc" font-family="Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">TRAFFIC CAMERA SURVEILLANCE FEED</text>
  <text x="300" y="200" fill="#f59e0b" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle">${text}</text>
  <text x="300" y="240" fill="#94a3b8" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">HIGH-SPEED ANPR VEHICLE EVIDENCE RECORD</text>
  <text x="300" y="280" fill="#38bdf8" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">Timestamp: 2026-10-15 11:20:05 IST | FPS: 60 | GPS Lock: Verified</text>
</svg>`;

  for (let i = 1; i <= 5; i++) {
    const filename = `ev_00${i}.jpg`;
    const targetPath = path.join(uploadDir, filename);
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, dummySvg(`EVIDENCE CAPTURE #00${i}`));
    }
  }

  console.log('==================================================');
  console.log('      DATABASE SETUP COMPLETED SUCCESSFULLY!      ');
  console.log('==================================================');
}

if (require.main === module) {
  runSetup().catch(err => {
    console.error('Fatal Setup Error:', err);
    process.exit(1);
  });
}

module.exports = { runSetup };
