import { z } from 'zod';

export const auditLogInputSchema = z.object({
  actor: z.string().trim().min(1).max(254),
  role: z.string().trim().min(1).max(80),
  action: z.string().trim().min(1).max(120),
  resource: z.string().trim().min(1).max(500),
  resourceType: z.string().trim().min(1).max(80),
  ipAddress: z.string().trim().min(1).max(64),
  region: z.string().trim().min(1).max(80),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['Unresolved', 'Investigating', 'Resolved', 'False Positive']),
  timestamp: z.coerce.date(),
  metadata: z.record(z.unknown()).optional()
}).strict();

export const bulkUploadSchema = z.array(auditLogInputSchema).min(1).max(10000);
