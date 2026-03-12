import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase, migrateDatabase } from './db';
import authRoutes from './routes/authRoutes';
import participantRoutes from './routes/participantRoutes';
import rankingRoutes from './routes/rankingRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/participants', participantRoutes);
app.use('/ranking', rankingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    await migrateDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Available endpoints:');
      console.log('  POST   /auth/login');
      console.log('  GET    /health');
      console.log('  POST   /participants');
      console.log('  GET    /participants');
      console.log('  GET    /participants/by-cedula');
      console.log('  GET    /ranking');
      console.log('  GET    /ranking/historical');
      console.log('  GET    /ranking/rule');
      console.log('  POST   /ranking/rule');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
