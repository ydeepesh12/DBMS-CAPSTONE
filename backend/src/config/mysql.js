const mysql = require('mysql2/promise');
require('./loadEnv')();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'traffic_challan',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  dateStrings: true
});

/**
 * Executes a stored procedure that has an OUT parameter using a single connection.
 * Example: callProcedureWithOut('CALL sp_generate_challan(?, @out_id)', [violationId], '@out_id')
 */
async function callProcedureWithOut(callSql, params, outVarName) {
  const connection = await pool.getConnection();
  try {
    await connection.query('SET ' + outVarName + ' = NULL');
    await connection.query(callSql, params);
    const [rows] = await connection.query('SELECT ' + outVarName + ' AS result');
    return rows[0] ? rows[0].result : null;
  } finally {
    connection.release();
  }
}

/**
 * Tests connection to MySQL
 */
async function testMySQLConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  pool,
  callProcedureWithOut,
  testMySQLConnection
};
