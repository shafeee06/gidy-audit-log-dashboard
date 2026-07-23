import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { AuditLog } from './model.js';
import { router } from './routes.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gidy_audit_logs_clean_v4';

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'] }));
app.use(express.json({ limit: '25mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', router);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Unexpected server error' });
});

async function start() {
  await mongoose.connect(mongoUri, { maxPoolSize: 30, minPoolSize: 2, serverSelectionTimeoutMS: 10000 });
  await AuditLog.createIndexes();
  app.listen(port, () => console.log(`Audit log API listening on port ${port}`));
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
