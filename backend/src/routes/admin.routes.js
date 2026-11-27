const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/mysql');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireRoles('TRAFFIC_ADMIN'));

// -------------------------------------------------------------
// Helper for generic listing with pagination & search
// -------------------------------------------------------------
async function getPaginatedList(table, searchColumns = [], search = '', limit = 50, offset = 0, orderBy = 'created_at DESC') {
  let sql = `SELECT * FROM ${table}`;
  const params = [];

  if (search && searchColumns.length > 0) {
    const clauses = searchColumns.map(col => `${col} LIKE ?`);
    sql += ` WHERE (${clauses.join(' OR ')})`;
    searchColumns.forEach(() => params.push(`%${search}%`));
  }

  sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const [rows] = await pool.execute(sql, params);

  // Total count
  let countSql = `SELECT COUNT(*) AS total FROM ${table}`;
  const countParams = [];
  if (search && searchColumns.length > 0) {
    const clauses = searchColumns.map(col => `${col} LIKE ?`);
    countSql += ` WHERE (${clauses.join(' OR ')})`;
    searchColumns.forEach(() => countParams.push(`%${search}%`));
  }
  const [countRows] = await pool.execute(countSql, countParams);

  return { rows, total: countRows[0].total };
}

// -------------------------------------------------------------
// 1. OWNERS CRUD
// -------------------------------------------------------------
router.get('/owners', async (req, res, next) => {
  try {
    const result = await getPaginatedList('owner', ['name', 'phone', 'email', 'national_id'], req.query.search, req.query.limit, req.query.offset, 'owner_id DESC');
    res.json({ success: true, data: result.rows, total: result.total });
  } catch (e) { next(e); }
});

router.post('/owners', async (req, res, next) => {
  try {
    const { name, email, phone, address, national_id } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO owner (name, email, phone, address, national_id) VALUES (?, ?, ?, ?, ?)',
      [name, email || null, phone, address || '', national_id]
    );
    res.status(201).json({ success: true, data: { owner_id: result.insertId } });
  } catch (e) { next(e); }
});

router.put('/owners/:id', async (req, res, next) => {
  try {
    const { name, email, phone, address, national_id } = req.body;
    await pool.execute(
      'UPDATE owner SET name = ?, email = ?, phone = ?, address = ?, national_id = ? WHERE owner_id = ?',
      [name, email || null, phone, address || '', national_id, req.params.id]
    );
    res.json({ success: true, data: { message: 'Owner updated successfully' } });
  } catch (e) { next(e); }
});

router.delete('/owners/:id', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM owner WHERE owner_id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Owner deleted successfully' } });
  } catch (e) { next(e); }
});

// -------------------------------------------------------------
// 2. VEHICLES CRUD
// -------------------------------------------------------------
router.get('/vehicles', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT v.*, o.name AS owner_name, o.phone AS owner_phone 
       FROM vehicle v 
       JOIN owner o ON v.owner_id = o.owner_id 
       ORDER BY v.vehicle_id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post('/vehicles', async (req, res, next) => {
  try {
    const { registration_no, chassis_no, engine_no, make_model, vehicle_type, color, owner_id, rc_status, registration_date } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO vehicle (registration_no, chassis_no, engine_no, make_model, vehicle_type, color, owner_id, rc_status, registration_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [registration_no, chassis_no, engine_no, make_model, vehicle_type, color, owner_id, rc_status || 'ACTIVE', registration_date || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json({ success: true, data: { vehicle_id: result.insertId } });
  } catch (e) { next(e); }
});

router.put('/vehicles/:id', async (req, res, next) => {
  try {
    const { registration_no, chassis_no, engine_no, make_model, vehicle_type, color, owner_id, rc_status, registration_date } = req.body;
    await pool.execute(
      `UPDATE vehicle SET registration_no = ?, chassis_no = ?, engine_no = ?, make_model = ?, vehicle_type = ?, color = ?, owner_id = ?, rc_status = ?, registration_date = ?
       WHERE vehicle_id = ?`,
      [registration_no, chassis_no, engine_no, make_model, vehicle_type, color, owner_id, rc_status, registration_date, req.params.id]
    );
    res.json({ success: true, data: { message: 'Vehicle updated successfully' } });
  } catch (e) { next(e); }
});

router.delete('/vehicles/:id', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM vehicle WHERE vehicle_id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Vehicle deleted successfully' } });
  } catch (e) { next(e); }
});

// -------------------------------------------------------------
// 3. LICENSES CRUD
// -------------------------------------------------------------
router.get('/licenses', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM license ORDER BY license_id DESC');
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post('/licenses', async (req, res, next) => {
  try {
    const { license_number, issue_date, expiry_date, license_class, status, points_demerit } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO license (license_number, issue_date, expiry_date, license_class, status, points_demerit) VALUES (?, ?, ?, ?, ?, ?)',
      [license_number, issue_date, expiry_date, license_class, status || 'ACTIVE', points_demerit || 0]
    );
    res.status(201).json({ success: true, data: { license_id: result.insertId } });
  } catch (e) { next(e); }
});

router.put('/licenses/:id', async (req, res, next) => {
  try {
    const { license_number, issue_date, expiry_date, license_class, status, points_demerit } = req.body;
    await pool.execute(
      'UPDATE license SET license_number = ?, issue_date = ?, expiry_date = ?, license_class = ?, status = ?, points_demerit = ? WHERE license_id = ?',
      [license_number, issue_date, expiry_date, license_class, status, points_demerit, req.params.id]
    );
    res.json({ success: true, data: { message: 'License updated successfully' } });
  } catch (e) { next(e); }
});

router.delete('/licenses/:id', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM license WHERE license_id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'License deleted successfully' } });
  } catch (e) { next(e); }
});

// -------------------------------------------------------------
// 4. DRIVERS CRUD
// -------------------------------------------------------------
router.get('/drivers', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT d.*, l.license_number, l.status AS license_status, l.points_demerit 
       FROM driver d 
       JOIN license l ON d.license_id = l.license_id 
       ORDER BY d.driver_id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post('/drivers', async (req, res, next) => {
  try {
    const { name, license_id, phone, email, address } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO driver (name, license_id, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [name, license_id, phone, email || null, address || '']
    );
    res.status(201).json({ success: true, data: { driver_id: result.insertId } });
  } catch (e) { next(e); }
});

router.put('/drivers/:id', async (req, res, next) => {
  try {
    const { name, license_id, phone, email, address } = req.body;
    await pool.execute(
      'UPDATE driver SET name = ?, license_id = ?, phone = ?, email = ?, address = ? WHERE driver_id = ?',
      [name, license_id, phone, email || null, address || '', req.params.id]
    );
    res.json({ success: true, data: { message: 'Driver updated successfully' } });
  } catch (e) { next(e); }
});

router.delete('/drivers/:id', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM driver WHERE driver_id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Driver deleted successfully' } });
  } catch (e) { next(e); }
});

// -------------------------------------------------------------
// 5. OFFICERS CRUD
// -------------------------------------------------------------
router.get('/officers', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM officer ORDER BY officer_id DESC');
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post('/officers', async (req, res, next) => {
  try {
    const { badge_number, name, designation, police_station, contact_number, email, status } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO officer (badge_number, name, designation, police_station, contact_number, email, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [badge_number, name, designation, police_station, contact_number, email, status || 'ACTIVE']
    );
    res.status(201).json({ success: true, data: { officer_id: result.insertId } });
  } catch (e) { next(e); }
});

router.put('/officers/:id', async (req, res, next) => {
  try {
    const { badge_number, name, designation, police_station, contact_number, email, status } = req.body;
    await pool.execute(
      'UPDATE officer SET badge_number = ?, name = ?, designation = ?, police_station = ?, contact_number = ?, email = ?, status = ? WHERE officer_id = ?',
      [badge_number, name, designation, police_station, contact_number, email, status, req.params.id]
    );
    res.json({ success: true, data: { message: 'Officer updated successfully' } });
  } catch (e) { next(e); }
});

router.delete('/officers/:id', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM officer WHERE officer_id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Officer deleted successfully' } });
  } catch (e) { next(e); }
});

// -------------------------------------------------------------
// 6. VIOLATION TYPES CRUD
// -------------------------------------------------------------
router.get('/violation-types', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM violation_type ORDER BY violation_type_id ASC');
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post('/violation-types', async (req, res, next) => {
  try {
    const { code, title, description, section_act, base_fine, late_fee_rate, demerit_points, severity } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO violation_type (code, title, description, section_act, base_fine, late_fee_rate, demerit_points, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [code, title, description || '', section_act, base_fine, late_fee_rate || 0.05, demerit_points || 0, severity || 'MEDIUM']
    );
    res.status(201).json({ success: true, data: { violation_type_id: result.insertId } });
  } catch (e) { next(e); }
});

router.put('/violation-types/:id', async (req, res, next) => {
  try {
    const { code, title, description, section_act, base_fine, late_fee_rate, demerit_points, severity } = req.body;
    await pool.execute(
      'UPDATE violation_type SET code = ?, title = ?, description = ?, section_act = ?, base_fine = ?, late_fee_rate = ?, demerit_points = ?, severity = ? WHERE violation_type_id = ?',
      [code, title, description || '', section_act, base_fine, late_fee_rate, demerit_points, severity, req.params.id]
    );
    res.json({ success: true, data: { message: 'Violation type updated successfully' } });
  } catch (e) { next(e); }
});

router.delete('/violation-types/:id', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM violation_type WHERE violation_type_id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Violation type deleted successfully' } });
  } catch (e) { next(e); }
});

// -------------------------------------------------------------
// 7. LOCATIONS CRUD
// -------------------------------------------------------------
router.get('/locations', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM location ORDER BY location_id ASC');
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post('/locations', async (req, res, next) => {
  try {
    const { area_name, junction_name, latitude, longitude, speed_limit, camera_id, zone_type } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO location (area_name, junction_name, latitude, longitude, speed_limit, camera_id, zone_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [area_name, junction_name, latitude, longitude, speed_limit || 50, camera_id || null, zone_type || 'COMMERCIAL']
    );
    res.status(201).json({ success: true, data: { location_id: result.insertId } });
  } catch (e) { next(e); }
});

router.put('/locations/:id', async (req, res, next) => {
  try {
    const { area_name, junction_name, latitude, longitude, speed_limit, camera_id, zone_type } = req.body;
    await pool.execute(
      'UPDATE location SET area_name = ?, junction_name = ?, latitude = ?, longitude = ?, speed_limit = ?, camera_id = ?, zone_type = ? WHERE location_id = ?',
      [area_name, junction_name, latitude, longitude, speed_limit, camera_id, zone_type, req.params.id]
    );
    res.json({ success: true, data: { message: 'Location updated successfully' } });
  } catch (e) { next(e); }
});

router.delete('/locations/:id', async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM location WHERE location_id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Location deleted successfully' } });
  } catch (e) { next(e); }
});

// -------------------------------------------------------------
// 8. APP USERS CRUD
// -------------------------------------------------------------
router.get('/users', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.user_id, u.username, u.role, u.officer_id, u.owner_id, u.active, u.created_at,
              off.name AS officer_name, o.name AS owner_name
       FROM app_user u
       LEFT JOIN officer off ON u.officer_id = off.officer_id
       LEFT JOIN owner o ON u.owner_id = o.owner_id
       ORDER BY u.user_id ASC`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post('/users', async (req, res, next) => {
  try {
    const { username, password, role, officer_id, owner_id, active } = req.body;
    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    const [result] = await pool.execute(
      'INSERT INTO app_user (username, password_hash, role, officer_id, owner_id, active) VALUES (?, ?, ?, ?, ?, ?)',
      [username, passwordHash, role, officer_id || null, owner_id || null, active !== false]
    );
    res.status(201).json({ success: true, data: { user_id: result.insertId } });
  } catch (e) { next(e); }
});

router.put('/users/:id', async (req, res, next) => {
  try {
    const { username, password, role, officer_id, owner_id, active } = req.body;
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.execute(
        'UPDATE app_user SET username = ?, password_hash = ?, role = ?, officer_id = ?, owner_id = ?, active = ? WHERE user_id = ?',
        [username, passwordHash, role, officer_id || null, owner_id || null, active !== false, req.params.id]
      );
    } else {
      await pool.execute(
        'UPDATE app_user SET username = ?, role = ?, officer_id = ?, owner_id = ?, active = ? WHERE user_id = ?',
        [username, role, officer_id || null, owner_id || null, active !== false, req.params.id]
      );
    }
    res.json({ success: true, data: { message: 'User updated successfully' } });
  } catch (e) { next(e); }
});

// -------------------------------------------------------------
// 9. AUDIT LOGS VIEWER
// -------------------------------------------------------------
router.get('/audit-logs', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const [rows] = await pool.execute(
      `SELECT a.*, c.challan_number, v.registration_no 
       FROM challan_audit a
       JOIN challan c ON a.challan_id = c.challan_id
       JOIN violation viol ON c.violation_id = viol.violation_id
       JOIN vehicle v ON viol.vehicle_id = v.vehicle_id
       ORDER BY a.timestamp DESC
       LIMIT ?`,
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

module.exports = router;
