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

EvidenceMetadataSchema.index({ violation_id: 1, media_type: 1 });
EvidenceMetadataSchema.index({ tags: 1, captured_at: -1 });

const EvidenceMetadata = mongoose.model('EvidenceMetadata', EvidenceMetadataSchema);

module.exports = {
  EvidenceMetadata
};
