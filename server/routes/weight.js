import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT date, weight FROM weight_log WHERE user_id=$1 ORDER BY date',
      [req.userId]
    );
    res.json(r.rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      weight: parseFloat(row.weight),
    })));
  } catch (e) {
    console.error('GET /weight:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { date, weight } = req.body;
    await pool.query(`
      INSERT INTO weight_log (user_id, date, weight) VALUES ($1,$2,$3)
      ON CONFLICT (user_id, date) DO UPDATE SET weight=$3
    `, [req.userId, date, weight]);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /weight:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:date', async (req, res) => {
  try {
    await pool.query('DELETE FROM weight_log WHERE user_id=$1 AND date=$2', [req.userId, req.params.date]);
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /weight:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
