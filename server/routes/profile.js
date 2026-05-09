import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
    res.json(r.rows[0] || null);
  } catch (e) {
    console.error('GET /profile:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { name, age, gender, height, weight, activity_level, goal } = req.body;
    await pool.query(`
      INSERT INTO profiles (user_id, name, age, gender, height, weight, activity_level, goal, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        name=$2, age=$3, gender=$4, height=$5, weight=$6,
        activity_level=$7, goal=$8, updated_at=NOW()
    `, [
      req.userId,
      name || null,
      age ? Number(age) : null,
      gender || null,
      height ? Number(height) : null,
      weight ? Number(weight) : null,
      activity_level || null,
      goal || null,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error('PUT /profile:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
