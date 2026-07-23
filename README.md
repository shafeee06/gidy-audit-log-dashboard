# Sentinel Audit Console - Gidy Full Stack Exercise

A MERN dashboard for uploading, viewing, filtering, sorting, paginating, and investigating system audit logs.

## Important data behavior

- The application does **not** seed or randomly create audit records.
- A fresh database opens with zero logs and zero dashboard counts. The application never seeds, generates, or deletes records automatically during startup.
- Only records uploaded by the user are stored.
- When records already exist, the upload dialog offers two explicit options:
  - **Add to existing data**: append the new file to the current records.
  - **Replace existing data**: delete the current records and keep only the newly uploaded file.

## Features

- One-request JSON upload for 1 to 10,000 audit records
- Schema validation before insertion
- Server-side search, filtering, sorting, and pagination
- Filters for role, action, resource type, region, severity, status, and date range
- Dashboard metrics calculated only from uploaded records
- Record investigation drawer with raw JSON
- MongoDB indexes for common investigation queries
- Clear loading, empty, success, and error states

## Windows quick start

Requirements: Node.js 20+, npm, and a locally running MongoDB service.

1. Extract the ZIP.
2. Double-click `START-WINDOWS.bat`.
3. Open `http://localhost:5173`.

The project uses the database `gidy_audit_logs_clean_v4`, so it starts separately from databases created by older versions of this assessment. For deployment, use a new MongoDB Atlas database with the same name or any empty database name.

## Manual setup

```bash
npm install
npm install --prefix server
npm install --prefix client
```

Copy `server/.env.example` to `server/.env`, then run:

```bash
npm run dev
```

## API

### `POST /api/logs/bulk?mode=append`
Adds the uploaded JSON array to existing records.

### `POST /api/logs/bulk?mode=replace`
Deletes all existing records, then stores only the uploaded JSON array.

### `GET /api/logs`
Supports `search`, filters, `sortBy`, `sortOrder`, `page`, and `limit`.

### `GET /api/logs/facets`
Returns values for the filter dropdowns.

### `GET /api/logs/stats`
Returns dashboard counts based only on stored records.

### `DELETE /api/logs`
Deletes all stored audit records.

## Technical decisions

1. MongoDB and Mongoose fit document-shaped audit records and flexible metadata.
2. `insertMany` handles up to 10,000 records efficiently in one API request.
3. All filtering, sorting, searching, and pagination run on the server.
4. Upload mode is explicit to prevent accidental mixing or deletion of datasets.
5. The replace workflow validates the complete payload before deleting existing data.
6. Indexed fields support common audit investigation paths.
7. No automatic seed data is included, ensuring the UI reflects only user uploads.


## Deployment notes

Deploy the server and client as separate services.

### Server environment variables

```env
PORT=5000
MONGODB_URI=<your MongoDB Atlas connection string>
CLIENT_ORIGIN=<your deployed frontend URL>
NODE_ENV=production
```

Server commands:

```bash
npm install
npm start
```

### Client environment variable

```env
VITE_API_URL=<your deployed backend URL>/api
```

Client commands:

```bash
npm install
npm run build
```

Publish the generated `dist` directory. After deployment, test a 10,000-record upload, filtering, search, sorting, pagination, and the investigation drawer before submitting the links.

## Performance optimizations

- Bulk uploads are validated once and inserted in unordered batches of 2,000 records.
- The upload request has a dedicated 180-second timeout to prevent false browser "Network Error" messages while MongoDB is still processing.
- A deliberately small MongoDB index set supports common filters/searches without heavily slowing writes.
- Exact server-side filters use indexed equality queries; full search uses MongoDB's text index.
- Dashboard statistics and filter facets are produced by one aggregation and cached briefly, reducing repeated database scans.
- Log list responses omit large metadata fields until investigation details are needed, reducing response size.
- MongoDB connection pooling is configured for repeated and concurrent requests.

Actual upload time depends on the computer, MongoDB host, disk speed, network latency, and deployment tier. Local uploads should no longer fail at the previous 30-second client timeout.
