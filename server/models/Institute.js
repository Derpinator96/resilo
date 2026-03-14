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
    ph: { type: Number, default: 7.0 },
    tds: { type: Number, default: 200 },
    turbidity: { type: Number, default: 1.0 },
    statusDesc: { type: String, default: 'Optimal/Clear' } 
  },
  waterLevel: { 
    level: { type: Number, default: 80 },
    pumpStatus: { type: String, default: 'Active' },
    statusDesc: { type: String, default: 'Normal Level' } 
  },
  solarGrid: {
    generation: { type: Number, default: 5 }, // kW
    efficiency: { type: Number, default: 95 }, // %
    statusDesc: { type: String, default: 'Stable' }
  },
  battery: {
    level: { type: Number, default: 100 }, // %
    health: { type: String, default: 'Good' }
  },
  electricity: {
    isAvailable: { type: Boolean, default: true }
  },
  powerCuts: {
    history: { type: Array, default: [] },
    frequency: { type: String, default: 'Rare' }
  },
  infraClimate: {
    temp: { type: Number, default: 28 }, // Celsius
    humidity: { type: Number, default: 55 } // %
  },
  equipmentHealth: {
    medicineFridgeTemp: { type: Number, default: 4 }, // Celsius, for Healthcare only
    statusDesc: { type: String, default: 'Optimal' }
  },
}, { timestamps: true });

const Institute = mongoose.model('Institute', instituteSchema);

export default Institute;
