import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { date } = req.query;
  const r = await pool.query(
    'SELECT * FROM exercise_log WHERE user_id=$1 AND date=$2 ORDER BY created_at',
    [req.userId, date]
  );
  res.json(r.rows.map((row) => ({
    id: String(row.id),
    date: row.date.toISOString().slice(0, 10),
    name: row.name,
    duration: row.duration,
    calories: row.calories,
  })));
});

router.post('/', async (req, res) => {
  const { date, name, duration, calories } = req.body;
  const r = await pool.query(
    'INSERT INTO exercise_log (user_id,date,name,duration,calories) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [req.userId, date, name, duration, calories]
  );
  res.json({ id: String(r.rows[0].id) });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM exercise_log WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
  res.json({ ok: true });
});

export default router;
