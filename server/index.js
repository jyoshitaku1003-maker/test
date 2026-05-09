import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { migrate } from './migrate.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import weightRoutes from './routes/weight.js';
import foodRoutes from './routes/food.js';
import exerciseRoutes from './routes/exercise.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/exercise', exerciseRoutes);

// Serve React build
app.use(express.static(join(__dirname, '../dist')));
app.get('*', (_, res) => res.sendFile(join(__dirname, '../dist/index.html')));

const PORT = process.env.PORT || 3000;

migrate()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((e) => { console.error('Migration failed:', e); process.exit(1); });
