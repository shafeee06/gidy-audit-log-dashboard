import express from 'express';
import { AuditLog } from './model.js';
import { auditLogInputSchema } from './validation.js';
import { buildLogQuery, parsePagination } from './query.js';

export const router = express.Router();
const MAX_RECORDS = 10000;
const INSERT_BATCH_SIZE = 2000;
let dashboardCache = null;
let dashboardCacheAt = 0;
const CACHE_TTL_MS = 15000;

function invalidateCache() {
  dashboardCache = null;
  dashboardCacheAt = 0;
}

function validatePayload(payload) {
  if (!Array.isArray(payload)) return { message: 'The JSON root must be an array.' };
  if (payload.length < 1 || payload.length > MAX_RECORDS) {
    return { message: `The request must contain between 1 and ${MAX_RECORDS.toLocaleString()} records.` };
  }

  const records = new Array(payload.length);
  for (let index = 0; index < payload.length; index += 1) {
    const parsed = auditLogInputSchema.safeParse(payload[index]);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return {
        message: 'Invalid audit log payload',
        errors: [{ path: `${index}.${issue.path.join('.')}`, message: issue.message }]
      };
    }
    records[index] = parsed.data;
  }
  return { records };
}

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'audit-log-api', timestamp: new Date().toISOString() });
});

router.post('/logs/bulk', async (req, res, next) => {
  try {
    const mode = req.query.mode === 'replace' ? 'replace' : 'append';
    const validation = validatePayload(req.body);
    if (!validation.records) return res.status(400).json(validation);

    const startedAt = Date.now();
    let deletedCount = 0;
    if (mode === 'replace') {
      const deletion = await AuditLog.collection.deleteMany({});
      deletedCount = deletion.deletedCount || 0;
    }

    let insertedCount = 0;
    for (let start = 0; start < validation.records.length; start += INSERT_BATCH_SIZE) {
      const batch = validation.records.slice(start, start + INSERT_BATCH_SIZE);
      const result = await AuditLog.collection.insertMany(batch, { ordered: false });
      insertedCount += result.insertedCount;
    }

    invalidateCache();
    const totalCount = mode === 'replace'
      ? insertedCount
      : await AuditLog.estimatedDocumentCount();

    return res.status(201).json({
      message: mode === 'replace' ? 'Existing audit logs were replaced successfully' : 'Audit logs were appended successfully',
      mode,
      deletedCount,
      insertedCount,
      totalCount,
      processingTimeMs: Date.now() - startedAt
    });
  } catch (error) {
    if (error?.name === 'MongoBulkWriteError' || error?.name === 'BulkWriteError') {
      return res.status(400).json({
        message: 'Bulk upload failed because one or more records could not be stored',
        insertedCount: error.result?.insertedCount || 0,
        writeErrors: error.writeErrors?.slice(0, 20).map((item) => item.errmsg)
      });
    }
    return next(error);
  }
});

router.delete('/logs', async (_req, res, next) => {
  try {
    const result = await AuditLog.collection.deleteMany({});
    invalidateCache();
    res.json({ message: 'All audit logs deleted', deletedCount: result.deletedCount || 0 });
  } catch (error) { next(error); }
});

router.get('/logs', async (req, res, next) => {
  try {
    const { filter, sort } = buildLogQuery(req.query);
    const { page, limit, skip } = parsePagination(req.query);
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter)
    ]);
    res.json({
      items,
      pagination: {
        page, limit, total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) { next(error); }
});

async function getDashboardData() {
  if (dashboardCache && Date.now() - dashboardCacheAt < CACHE_TTL_MS) return dashboardCache;

  const [summary] = await AuditLog.aggregate([{ $facet: {
    total: [{ $count: 'count' }],
    unresolved: [{ $match: { status: 'Unresolved' } }, { $count: 'count' }],
    critical: [{ $match: { severity: 'CRITICAL' } }, { $count: 'count' }],
    last24Hours: [{ $match: { timestamp: { $gte: new Date(Date.now() - 86400000) } } }, { $count: 'count' }],
    roles: [{ $group: { _id: '$role' } }, { $sort: { _id: 1 } }],
    actions: [{ $group: { _id: '$action' } }, { $sort: { _id: 1 } }],
    resourceTypes: [{ $group: { _id: '$resourceType' } }, { $sort: { _id: 1 } }],
    regions: [{ $group: { _id: '$region' } }, { $sort: { _id: 1 } }],
    severities: [{ $group: { _id: '$severity' } }, { $sort: { _id: 1 } }],
    statuses: [{ $group: { _id: '$status' } }, { $sort: { _id: 1 } }],
    bySeverity: [{ $group: { _id: '$severity', count: { $sum: 1 } } }],
    byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }]
  } }]);

  const countOf = (key) => summary[key]?.[0]?.count || 0;
  const values = (key) => summary[key].map((item) => item._id).filter(Boolean);
  dashboardCache = {
    stats: {
      total: countOf('total'), unresolved: countOf('unresolved'), critical: countOf('critical'),
      last24Hours: countOf('last24Hours'), bySeverity: summary.bySeverity, byStatus: summary.byStatus
    },
    facets: {
      roles: values('roles'), actions: values('actions'), resourceTypes: values('resourceTypes'),
      regions: values('regions'), severities: values('severities'), statuses: values('statuses')
    }
  };
  dashboardCacheAt = Date.now();
  return dashboardCache;
}

router.get('/logs/dashboard', async (_req, res, next) => {
  try { res.json(await getDashboardData()); } catch (error) { next(error); }
});
router.get('/logs/facets', async (_req, res, next) => {
  try { res.json((await getDashboardData()).facets); } catch (error) { next(error); }
});
router.get('/logs/stats', async (_req, res, next) => {
  try { res.json((await getDashboardData()).stats); } catch (error) { next(error); }
});
