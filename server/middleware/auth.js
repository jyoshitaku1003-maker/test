import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function signToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '30d' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'トークンが無効です' });
  }
}
