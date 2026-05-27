import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'RESOLVE']
  },
  targetCollection: {
    type: String,
    required: true
  },
  targetDocumentId: {
    type: String,
    required: true
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed
  },
  newState: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { collection: 'audit_logs' });

export default mongoose.model('AuditLog', auditLogSchema);
