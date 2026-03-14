import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  instituteId: String,
  instituteName: String,
  component: String,
  type: { type: String, enum: ['Manual', 'Auto'] },
  status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
  description: String,
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date
})

export default mongoose.models.Report || mongoose.model('Report', reportSchema)
