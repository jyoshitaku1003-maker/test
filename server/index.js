import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { migrate } from './migrate.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import weightRoutes from './routes/weight.js';
import foodRoutes from './routes/food.js';
import exerciseRoutes from './routes/exercise.js';
import analyzeRoutes from './routes/analyze.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/analyze', analyzeRoutes);

// Serve React build
app.use(express.static(join(__dirname, '../dist')));
app.get('*', (_, res) => res.sendFile(join(__dirname, '../dist/index.html')));

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;

migrate()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((e) => { console.error('Migration failed:', e); process.exit(1); });
