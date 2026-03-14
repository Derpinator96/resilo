import mongoose from 'mongoose'

const instituteSchema = new mongoose.Schema({
  name: String,
  type: String,
  district: String,
  isMock: { type: Boolean, default: false },
  waterQuality: {
    ph: Number,
    tds: Number,
    turbidity: Number,
    statusDesc: String
  },
  waterLevel: {
    level: Number,
    pumpStatus: String,
    statusDesc: String
  },
  solarGrid: {
    generation: Number,
    efficiency: Number,
    statusDesc: String
  },
  battery: {
    level: Number,
    health: String
  },
  electricity: {
    isAvailable: Boolean
  },
  powerCuts: {
    history: [String],
    frequency: String
  },
  infraClimate: {
    temp: Number,
    humidity: Number
  },
  equipmentHealth: {
    medicineFridgeTemp: Number,
    statusDesc: String
  }
})

export default mongoose.models.Institute || mongoose.model('Institute', instituteSchema)
