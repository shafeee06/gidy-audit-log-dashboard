const exactFilters = ['actor', 'role', 'action', 'resourceType', 'ipAddress', 'region', 'severity', 'status'];
const allowedSortFields = new Set(['timestamp', 'actor', 'role', 'action', 'resourceType', 'region', 'severity', 'status']);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildLogQuery(query) {
  const filter = {};

  // Filter dropdowns send canonical stored values, so equality allows MongoDB indexes.
  for (const field of exactFilters) {
    if (typeof query[field] === 'string' && query[field].trim()) {
      filter[field] = query[field].trim();
    }
  }

  if (query.search?.trim()) {
    const term = query.search.trim();
    // Text search is indexed and significantly faster for large collections.
    // Short fragments still use a safe regex fallback for user friendliness.
    if (term.length >= 3) {
      filter.$text = { $search: term };
    } else {
      const pattern = { $regex: escapeRegex(term), $options: 'i' };
      filter.$or = [
        { actor: pattern }, { role: pattern }, { action: pattern },
        { resource: pattern }, { resourceType: pattern },
        { ipAddress: pattern }, { region: pattern }
      ];
    }
  }

  if (query.startDate || query.endDate) {
    filter.timestamp = {};
    if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.timestamp.$lte = end;
    }
  }

  const requestedSort = allowedSortFields.has(query.sortBy) ? query.sortBy : 'timestamp';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  return { filter, sort: { [requestedSort]: sortOrder, _id: -1 } };
}

export function parsePagination(query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 25, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}
