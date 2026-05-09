import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const r = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
  res.json(r.rows[0] || null);
});

router.put('/', async (req, res) => {
  const { name, age, gender, height, weight, activity_level, goal, openai_api_key } = req.body;
  await pool.query(`
    INSERT INTO profiles (user_id, name, age, gender, height, weight, activity_level, goal, openai_api_key, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      name=$2, age=$3, gender=$4, height=$5, weight=$6,
      activity_level=$7, goal=$8, openai_api_key=$9, updated_at=NOW()
  `, [req.userId, name, age, gender, height, weight, activity_level, goal, openai_api_key]);
  res.json({ ok: true });
});

export default router;
