import mongoose from 'mongoose';

const roleRequestSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true
  },
  clerkUserEmail: {
    type: String,
    required: true
  },
  requestedRole: {
    type: String,
    required: true,
    enum: ['staff', 'admin']
  },
  requestedInstituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CentreData',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: String,
    default: null
  }
}, { timestamps: true, collection: 'role_requests' });

export default mongoose.model('RoleRequest', roleRequestSchema);
