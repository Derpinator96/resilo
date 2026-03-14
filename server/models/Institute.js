import mongoose from 'mongoose';

const instituteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['School', 'Healthcare'],
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  isMock: {
    type: Boolean,
    default: true,
  },
  waterQuality: {
    type: String,
    default: 'Unknown',
  },
  waterLevel: {
    type: Number,
    default: 0,
  },
  solarHealth: {
    type: String,
    default: 'Unknown',
  },
}, { timestamps: true });

const Institute = mongoose.model('Institute', instituteSchema);

export default Institute;
