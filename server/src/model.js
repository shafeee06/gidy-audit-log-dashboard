import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true, trim: true, maxlength: 254 },
    role: { type: String, required: true, trim: true, maxlength: 80 },
    action: { type: String, required: true, trim: true, maxlength: 120 },
    resource: { type: String, required: true, trim: true, maxlength: 500 },
    resourceType: { type: String, required: true, trim: true, maxlength: 80 },
    ipAddress: { type: String, required: true, trim: true, maxlength: 64 },
    region: { type: String, required: true, trim: true, maxlength: 80 },
    severity: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    status: { type: String, required: true, enum: ['Unresolved', 'Investigating', 'Resolved', 'False Positive'] },
    timestamp: { type: Date, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: undefined }
  },
  {
    versionKey: false,
    autoIndex: false
  }
);

// Keep the index set deliberately small: every extra index slows bulk writes.
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ severity: 1, status: 1, timestamp: -1 });
auditLogSchema.index({ role: 1, action: 1, resourceType: 1, region: 1, timestamp: -1 });
auditLogSchema.index({
  actor: 'text',
  action: 'text',
  resource: 'text',
  resourceType: 'text',
  ipAddress: 'text',
  region: 'text',
  role: 'text'
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
