import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT name, calories, protein, carbs, fat FROM food_corrections WHERE user_id = $1',
      [req.userId]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('GET /food-corrections:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat } = req.body;
    await pool.query(`
      INSERT INTO food_corrections (user_id, name, calories, protein, carbs, fat, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id, name) DO UPDATE SET
        calories = $3, protein = $4, carbs = $5, fat = $6, updated_at = NOW()
    `, [req.userId, name, Number(calories) || 0, Number(protein) || 0, Number(carbs) || 0, Number(fat) || 0]);
    res.json({ ok: true });
  } catch (e) {
    console.error('PUT /food-corrections:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
