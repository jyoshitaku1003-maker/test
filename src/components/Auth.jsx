import { useState } from 'react';
import { login, register, setToken } from '../utils/api';

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const { token } = await fn(email, password);
      setToken(token);
      onAuth();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">🥗</div>
        <h1 className="auth-title">ダイエットトラッカー</h1>
        <p className="auth-subtitle">カロリー収支・体重・運動を記録</p>

        <div className="segmented" style={{ marginBottom: 20 }}>
          <button className={`seg-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
            ログイン
          </button>
          <button className={`seg-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
            新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>メールアドレス</label>
            <input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>パスワード{mode === 'register' && ' (6文字以上)'}</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}
