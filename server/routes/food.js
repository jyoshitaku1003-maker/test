import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const r = await pool.query(
      'SELECT * FROM food_log WHERE user_id=$1 AND date=$2 ORDER BY created_at',
      [req.userId, date]
    );
    res.json(r.rows.map((row) => ({
      id: String(row.id),
      date: row.date.toISOString().slice(0, 10),
      mealType: row.meal_type,
      name: row.name,
      calories: row.calories,
      protein: parseFloat(row.protein),
      carbs: parseFloat(row.carbs),
      fat: parseFloat(row.fat),
    })));
  } catch (e) {
    console.error('GET /food:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { date, mealType, name, calories, protein, carbs, fat } = req.body;
    const r = await pool.query(
      'INSERT INTO food_log (user_id,date,meal_type,name,calories,protein,carbs,fat) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [req.userId, date, mealType, name, calories, protein || 0, carbs || 0, fat || 0]
    );
    res.json({ id: String(r.rows[0].id) });
  } catch (e) {
    console.error('POST /food:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM food_log WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /food:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
