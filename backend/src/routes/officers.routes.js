const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { z } = require('zod');
const { pool, callProcedureWithOut } = require('../config/mysql');
const { validate } = require('../middleware/validate');
const { authenticateToken, requireRoles, optionalAuth } = require('../middleware/authMiddleware');
const { EvidenceMetadata } = require('../models/EvidenceModel');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/evidence');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Master data for dropdowns (violation types, locations) - Public/Optional Auth so form always populates
router.get('/master-data', optionalAuth, async (req, res, next) => {
  try {
    const [violationTypes] = await pool.execute(
      'SELECT violation_type_id, code, title, section_act, base_fine, late_fee_rate, demerit_points, severity FROM violation_type ORDER BY base_fine ASC'
    );
    const [locations] = await pool.execute(
      'SELECT location_id, area_name, junction_name, latitude, longitude, speed_limit, camera_id, zone_type FROM location ORDER BY area_name ASC'
    );

    res.json({
      success: true,
      data: {
        violationTypes,
        locations
      }
    });
  } catch (err) {
    next(err);
  }
});

// All subsequent routes require OFFICER or TRAFFIC_ADMIN
router.use(authenticateToken, requireRoles('OFFICER', 'TRAFFIC_ADMIN'));

// Vehicle Autocomplete & License Status Warning Lookup
router.get('/vehicles/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const [rows] = await pool.execute(
      `SELECT 
        v.vehicle_id,
        v.registration_no,
        v.chassis_no,
        v.engine_no,
        v.make_model,
        v.vehicle_type,
        v.color,
        v.rc_status,
        o.owner_id,
        o.name AS owner_name,
        o.phone AS owner_phone,
        o.national_id,
        d.driver_id,
        d.name AS registered_driver_name,
        l.license_id,
        l.license_number,
        l.license_class,
        l.status AS license_status,
        l.points_demerit,
        (SELECT COUNT(*) FROM challan c 
         JOIN violation viol ON c.violation_id = viol.violation_id 
         WHERE viol.vehicle_id = v.vehicle_id AND c.status IN ('UNPAID', 'OVERDUE')) AS active_unpaid_challans
       FROM vehicle v
       JOIN owner o ON v.owner_id = o.owner_id
       LEFT JOIN driver d ON d.phone = o.phone
       LEFT JOIN license l ON d.license_id = l.license_id
       WHERE v.registration_no LIKE ?
       LIMIT 10`,
      [`%${q}%`]
    );

    // Compute risk warnings
    const results = rows.map(item => {
      const warnings = [];
      if (item.rc_status === 'SUSPENDED' || item.rc_status === 'EXPIRED') {
        warnings.push(`Vehicle RC is ${item.rc_status}`);
      }
      if (item.license_status === 'SUSPENDED' || item.license_status === 'EXPIRED' || item.license_status === 'REVOKED') {
        warnings.push(`Driver License is ${item.license_status}! Penalty points: ${item.points_demerit}`);
      }
      if (item.active_unpaid_challans > 2) {
        warnings.push(`Habitual defaulter: ${item.active_unpaid_challans} pending unpaid challans`);
      }
      return {
        ...item,
        hasRiskWarning: warnings.length > 0,
        riskWarnings: warnings
      };
    });

    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    next(err);
  }
});



// Record new violation with evidence upload
router.post('/violations', upload.single('evidenceFile'), async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.body.vehicleId, 10);
    const driverId = req.body.driverId ? parseInt(req.body.driverId, 10) : null;
    const violationTypeId = parseInt(req.body.violationTypeId, 10);
    const locationId = parseInt(req.body.locationId, 10);
    const speedRecorded = req.body.speedRecorded ? parseInt(req.body.speedRecorded, 10) : null;
    const remarks = req.body.remarks || 'Recorded via Officer Terminal';
    const officerId = req.user.officer_id || 1;
    const autoGenerateChallan = req.body.autoGenerateChallan === 'true' || req.body.autoGenerateChallan === true;

    if (!vehicleId || !violationTypeId || !locationId) {
      return res.status(400).json({
        success: false,
        error: 'vehicleId, violationTypeId, and locationId are required.'
      });
    }

    // Insert violation in MySQL
    const [insertResult] = await pool.execute(
      `INSERT INTO violation 
        (vehicle_id, driver_id, violation_type_id, location_id, officer_id, violation_timestamp, speed_recorded, remarks, status)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, 'LOGGED')`,
      [vehicleId, driverId, violationTypeId, locationId, officerId, speedRecorded, remarks]
    );

    const violationId = insertResult.insertId;

    // Handle uploaded evidence
    let mongoDocId = null;
    let evidenceStoragePath = '/uploads/evidence/placeholder.jpg';
    let mediaType = 'IMAGE';
    let md5Hash = 'dummy-hash';
    let fileSizeKb = 0;

    if (req.file) {
      evidenceStoragePath = `/uploads/evidence/${req.file.filename}`;
      fileSizeKb = Math.round(req.file.size / 1024);

      // Compute MD5 hash
      const fileBuffer = fs.readFileSync(req.file.path);
      md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

      // Save document in MongoDB
      try {
        const mongoDoc = await EvidenceMetadata.create({
          violation_id: violationId,
          camera_id: req.body.cameraId || 'OFFICER-MOBILE-CAM',
          media_type: 'IMAGE',
          file_url: evidenceStoragePath,
          file_size_kb: fileSizeKb,
          md5_hash: md5Hash,
          captured_at: new Date(),
          tags: ['officer_field_capture', 'manual_tag', 'verified'],
          ai_confidence_score: 0.95,
          camera_metadata: {
            device_model: 'Officer Handheld Rugged Terminal',
            resolution: '1920x1080',
            fps: 30,
            weather: 'CLEAR'
          }
        });
        mongoDocId = mongoDoc._id.toString();
      } catch (mongoErr) {
        console.warn('MongoDB evidence save error:', mongoErr.message);
      }

      // Record in MySQL evidence table
      await pool.execute(
        `INSERT INTO evidence 
          (violation_id, media_type, storage_path, mongo_evidence_id, captured_at, file_size_kb, md5_hash)
         VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
        [violationId, mediaType, evidenceStoragePath, mongoDocId, fileSizeKb, md5Hash]
      );
    }

    let generatedChallanId = null;
    if (autoGenerateChallan) {
      // Call sp_generate_challan with OUT parameter
      generatedChallanId = await callProcedureWithOut(
        'CALL sp_generate_challan(?, @out_id)',
        [violationId],
        '@out_id'
      );
    }

    res.status(201).json({
      success: true,
      data: {
        violationId,
        challanId: generatedChallanId,
        message: generatedChallanId 
          ? 'Violation recorded and Challan generated successfully via sp_generate_challan.' 
          : 'Violation logged successfully.'
      }
    });
  } catch (err) {
    next(err);
  }
});

// Trigger Challan Generation explicitly via Stored Procedure
router.post('/generate-challan', async (req, res, next) => {
  try {
    const violationId = parseInt(req.body.violationId, 10);
    if (!violationId) {
      return res.status(400).json({ success: false, error: 'violationId is required.' });
    }

    const challanId = await callProcedureWithOut(
      'CALL sp_generate_challan(?, @out_id)',
      [violationId],
      '@out_id'
    );

    const [challanRows] = await pool.execute(
      'SELECT challan_id, challan_number, fine_amount, total_amount, due_date, status FROM challan WHERE challan_id = ?',
      [challanId]
    );

    res.json({
      success: true,
      data: {
        message: 'Challan issued successfully via sp_generate_challan',
        challan: challanRows[0] || null
      }
    });
  } catch (err) {
    next(err);
  }
});

// Officer Workload & Recorded Violations
router.get('/my-workload', async (req, res, next) => {
  try {
    const officerId = req.user.officer_id || 1;

    const [stats] = await pool.execute(
      'SELECT * FROM v_officer_workload WHERE officer_id = ?',
      [officerId]
    );

    const [violations] = await pool.execute(
      `SELECT 
        v.violation_id,
        v.violation_timestamp,
        v.speed_recorded,
        v.remarks,
        v.status AS violation_status,
        veh.registration_no,
        veh.make_model,
        vt.title AS violation_title,
        vt.base_fine,
        loc.area_name,
        loc.junction_name,
        c.challan_id,
        c.challan_number,
        c.status AS challan_status,
        c.total_amount
       FROM violation v
       JOIN vehicle veh ON v.vehicle_id = veh.vehicle_id
       JOIN violation_type vt ON v.violation_type_id = vt.violation_type_id
       JOIN location loc ON v.location_id = loc.location_id
       LEFT JOIN challan c ON v.violation_id = c.violation_id
       WHERE v.officer_id = ?
       ORDER BY v.violation_timestamp DESC
       LIMIT 50`,
      [officerId]
    );

    res.json({
      success: true,
      data: {
        stats: stats[0] || null,
        violations
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
