import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
  },
  instituteName: {
    type: String,
    required: true,
  },
  component: {
    type: String, // e.g., 'Solar Grid', 'Medicine Refrigerator', 'Water Quality'
    required: true,
  },
  type: {
    type: String,
    enum: ['Manual', 'Auto'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved'],
    default: 'Active',
  },
  resolvedAt: {
    type: Date,
  },
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;
