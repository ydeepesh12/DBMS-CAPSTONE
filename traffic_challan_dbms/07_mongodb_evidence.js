/**
 * Traffic Violation & Smart Challan Management System
 * Script: 07_mongodb_evidence.js
 * Description: MongoDB evidence document model, sample docs, and aggregation pipelines
 */

const mongoose = require('mongoose');

const EvidenceMetadataSchema = new mongoose.Schema({
  violation_id: { type: Number, required: true, index: true },
  camera_id: { type: String, required: true, index: true },
  media_type: { 
    type: String, 
    enum: ['IMAGE', 'VIDEO', 'RADAR_LOG', 'ANPR_SCAN'], 
    required: true 
  },
  file_url: { type: String, required: true },
  file_size_kb: { type: Number, default: 0 },
  md5_hash: { type: String, required: true },
  captured_at: { type: Date, required: true },
  tags: [{ type: String, index: true }],
  ai_confidence_score: { type: Number, min: 0, max: 1, default: 0.95 },
  ocr_plate_text: { type: String },
  camera_metadata: {
    device_model: { type: String, default: 'Hikvision ANPR 4K Pro' },
    resolution: { type: String, default: '3840x2160' },
    fps: { type: Number, default: 60 },
    focal_length_mm: { type: Number, default: 50 },
    weather: { type: String, enum: ['CLEAR', 'RAIN', 'FOG', 'CLOUDY'], default: 'CLEAR' },
    lux_level: { type: Number, default: 450 }
  }
}, {
  timestamps: true,
  collection: 'evidence_metadata'
});

// Compound index for fast queries by violation & camera
EvidenceMetadataSchema.index({ violation_id: 1, media_type: 1 });
EvidenceMetadataSchema.index({ tags: 1, captured_at: -1 });

const EvidenceMetadata = mongoose.model('EvidenceMetadata', EvidenceMetadataSchema);

// Aggregation Pipeline 1: Count and average file size by media type
const aggregateByMediaType = async () => {
  return EvidenceMetadata.aggregate([
    {
      $group: {
        _id: '$media_type',
        count: { $sum: 1 },
        avg_size_kb: { $avg: '$file_size_kb' },
        avg_confidence: { $avg: '$ai_confidence_score' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Aggregation Pipeline 2: Top Tag distribution
const aggregateTopTags = async () => {
  return EvidenceMetadata.aggregate([
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        occurrences: { $sum: 1 }
      }
    },
    { $sort: { occurrences: -1 } },
    { $limit: 10 }
  ]);
};

// Aggregation Pipeline 3: Camera performance and confidence breakdown
const aggregateCameraPerformance = async () => {
  return EvidenceMetadata.aggregate([
    {
      $group: {
        _id: '$camera_id',
        total_captures: { $sum: 1 },
        avg_confidence: { $avg: '$ai_confidence_score' },
        min_confidence: { $min: '$ai_confidence_score' },
        weather_breakdown: { $addToSet: '$camera_metadata.weather' }
      }
    },
    { $sort: { total_captures: -1 } }
  ]);
};

// Seed initial realistic evidence data
const seedMongoEvidence = async () => {
  const count = await EvidenceMetadata.countDocuments();
  if (count > 0) return;

  const samples = [
    {
      violation_id: 1,
      camera_id: 'CAM-DEL-CP-01',
      media_type: 'IMAGE',
      file_url: '/uploads/evidence/ev_001.jpg',
      file_size_kb: 420,
      md5_hash: 'd41d8cd98f00b204e9800998ecf8427e',
      captured_at: new Date('2026-10-15T11:20:05Z'),
      tags: ['anpr', 'radar_triggered', 'clear_lighting', 'speed_alert'],
      ai_confidence_score: 0.98,
      ocr_plate_text: 'DL01AB1234',
      camera_metadata: {
        device_model: 'Hikvision ANPR 4K Pro',
        resolution: '3840x2160',
        fps: 60,
        focal_length_mm: 50,
        weather: 'CLEAR',
        lux_level: 680
      }
    },
    {
      violation_id: 2,
      camera_id: 'CAM-MUM-BW-02',
      media_type: 'IMAGE',
      file_url: '/uploads/evidence/ev_002.jpg',
      file_size_kb: 512,
      md5_hash: '9e107d9d372bb6826bd81d3542a419d6',
      captured_at: new Date('2026-10-20T14:45:08Z'),
      tags: ['traffic_light_sync', 'intersection_cross', 'anpr'],
      ai_confidence_score: 0.94,
      ocr_plate_text: 'MH02CD5678',
      camera_metadata: {
        device_model: 'Dahua TrafficMaster AI',
        resolution: '3840x2160',
        fps: 30,
        focal_length_mm: 35,
        weather: 'CLOUDY',
        lux_level: 420
      }
    },
    {
      violation_id: 3,
      camera_id: 'CAM-BLR-IN-03',
      media_type: 'IMAGE',
      file_url: '/uploads/evidence/ev_003.jpg',
      file_size_kb: 380,
      md5_hash: 'c4ca4238a0b923820dcc509a6f75849b',
      captured_at: new Date('2026-11-01T09:15:10Z'),
      tags: ['two_wheeler', 'helmet_detection_ai', 'front_view'],
      ai_confidence_score: 0.91,
      ocr_plate_text: 'KA03EF9012',
      camera_metadata: {
        device_model: 'Hikvision SmartPTZ Dome',
        resolution: '2560x1440',
        fps: 60,
        focal_length_mm: 75,
        weather: 'CLEAR',
        lux_level: 540
      }
    },
    {
      violation_id: 4,
      camera_id: 'CAM-GUR-CC-01',
      media_type: 'IMAGE',
      file_url: '/uploads/evidence/ev_004.jpg',
      file_size_kb: 450,
      md5_hash: 'c81e728d9d4c2f636f067f89cc14862c',
      captured_at: new Date('2026-11-05T18:30:12Z'),
      tags: ['mobile_usage_ai', 'cabin_view', 'night_infrared'],
      ai_confidence_score: 0.89,
      ocr_plate_text: 'HR26BC3456',
      camera_metadata: {
        device_model: 'Axis Q1656-LE Radar-Video',
        resolution: '3840x2160',
        fps: 60,
        focal_length_mm: 85,
        weather: 'CLEAR',
        lux_level: 120
      }
    },
    {
      violation_id: 5,
      camera_id: 'CAM-DEL-DK-04',
      media_type: 'IMAGE',
      file_url: '/uploads/evidence/ev_005.jpg',
      file_size_kb: 395,
      md5_hash: 'eccbc87e4b5ce2fe28308fd9f2a7baf3',
      captured_at: new Date('2026-11-10T16:10:02Z'),
      tags: ['seatbelt_ai', 'windshield_polarizer', 'daylight'],
      ai_confidence_score: 0.96,
      ocr_plate_text: 'WB04GH7890',
      camera_metadata: {
        device_model: 'Hikvision ANPR 4K Pro',
        resolution: '3840x2160',
        fps: 60,
        focal_length_mm: 50,
        weather: 'CLEAR',
        lux_level: 710
      }
    }
  ];

  await EvidenceMetadata.insertMany(samples);
  console.log('MongoDB: Seeded 5 initial evidence documents successfully');
};

module.exports = {
  EvidenceMetadata,
  aggregateByMediaType,
  aggregateTopTags,
  aggregateCameraPerformance,
  seedMongoEvidence
};
