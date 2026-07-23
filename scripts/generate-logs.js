const fs = require('fs');
const path = require('path');

const countArg = Number(process.argv[2] || 10000);
const count = Number.isInteger(countArg) && countArg > 0 ? Math.min(countArg, 10000) : 10000;

const actors = ['priya.nair', 'arjun.kumar', 'meera.shah', 'vikram.rao', 'ananya.iyer', 'rahul.singh'];
const roles = ['admin', 'security_engineer', 'developer', 'auditor', 'support'];
const actions = ['LOGIN', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'READ_SECRET', 'EXPORT_DATA', 'CHANGE_ROLE'];
const resourceTypes = ['USER', 'SESSION', 'SECRET', 'REPORT', 'ROLE', 'API_KEY'];
const regions = ['ap-south-1', 'us-east-1', 'eu-west-1', 'ap-southeast-1'];
const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statuses = ['Unresolved', 'Investigating', 'Resolved', 'False Positive'];

function pick(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function ip() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

const now = Date.now();
const records = Array.from({ length: count }, (_, index) => {
  const resourceType = pick(resourceTypes);
  const id = 100 + Math.floor(Math.random() * 90000);
  return {
    actor: `${pick(actors)}@company.com`,
    role: pick(roles),
    action: pick(actions),
    resource: `/api/${resourceType.toLowerCase()}s/${id}`,
    resourceType,
    ipAddress: ip(),
    region: pick(regions),
    severity: pick(severities),
    status: pick(statuses),
    timestamp: new Date(now - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 90)).toISOString(),
    metadata: { source: 'generated', sequence: index + 1 }
  };
});

const target = path.join(__dirname, '..', 'sample-data', `audit-logs-${count}.json`);
fs.writeFileSync(target, JSON.stringify(records, null, 2));
console.log(`Generated ${count} audit logs at ${target}`);
