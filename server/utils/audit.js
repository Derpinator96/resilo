import AuditLog from '../models/AuditLog.js';

export const logAudit = async (userId, action, targetCollection, docId, oldData, newData) => {
  try {
    await AuditLog.create({
      clerkUserId: userId,
      action,
      targetCollection,
      targetDocumentId: docId,
      previousState: oldData || null,
      newState: newData || null
    });
  } catch (err) {
    console.error("Audit Log Error:", err);
  }
};
