import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'メールとパスワードは必須です' });
  if (password.length < 6) return res.status(400).json({ error: 'パスワードは6文字以上にしてください' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email.toLowerCase(), hash]
    );
    const token = signToken(result.rows[0].id);
    res.json({ token });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
    console.error(e);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'メールとパスワードは必須です' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'メールアドレスまたはパスワードが違います' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'メールアドレスまたはパスワードが違います' });

    const token = signToken(user.id);
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

export default router;
