import { useState } from 'react';
import { saveProfile } from '../utils/api';
import { calcBMR, calcTDEE, calcAge, calcGoalDetails } from '../utils/calculations';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: '座り仕事が多い (×1.2)' },
  { value: 'light', label: '軽い運動 (週1〜3回) (×1.375)' },
  { value: 'moderate', label: '中程度の運動 (週3〜5回) (×1.55)' },
  { value: 'active', label: '激しい運動 (週6〜7回) (×1.725)' },
  { value: 'very_active', label: '非常に激しい運動 (×1.9)' },
];

// YYYY-MM-DD → YYYY/MM/DD
function toDisplay(value) {
  if (!value) return '';
  const d = value.replace(/-/g, '');
  if (d.length === 8) return `${d.slice(0,4)}/${d.slice(4,6)}/${d.slice(6,8)}`;
  return value.replace(/-/g, '/');
}

function formatDigits(digits) {
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0,4)}/${digits.slice(4)}`;
  return `${digits.slice(0,4)}/${digits.slice(4,6)}/${digits.slice(6,8)}`;
}

function toValue(display) {
  const d = display.replace(/\D/g, '');
  if (d.length === 8) return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
  return '';
}

function isValidDate(value) {
  if (!value) return false;
  return !isNaN(new Date(value).getTime());
}

// goal_date を "X月X日" 形式で表示
function formatGoalDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function Profile({ profile, onSave, onLogout }) {
  const [form, setForm] = useState(
    profile || { name: '', birthday: '', gender: 'male', height: '', weight: '', activity_level: 'moderate', goal_weight: '', goal_date: '' }
  );
  const [birthdayInput, setBirthdayInput] = useState(() => toDisplay(profile?.birthday || ''));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleBirthdayChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    const formatted = formatDigits(digits);
    setBirthdayInput(formatted);
    const value = toValue(formatted);
    set('birthday', value && isValidDate(value) ? value : '');
  };

  const handleCalendarChange = (e) => {
    const value = e.target.value;
    if (value) { set('birthday', value); setBirthdayInput(toDisplay(value)); }
  };

  const handleSave = async () => {
    setError('');
    try {
      await saveProfile(form);
      onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    }
  };

  const isComplete = form.name && form.birthday && form.height && form.weight;
  const previewProfile = isComplete
    ? { ...form, height: Number(form.height), weight: Number(form.weight), activityLevel: form.activity_level }
    : null;

  const age = form.birthday && isValidDate(form.birthday) ? calcAge(form.birthday) : null;
  const goalDetails = previewProfile ? calcGoalDetails(previewProfile) : null;

  return (
    <div className="screen">
      <div className="screen-header"><h1>プロフィール設定</h1></div>

      <div className="card">
        <h3 className="card-title">基本情報</h3>
        <div className="form-field">
          <label>ニックネーム</label>
          <input placeholder="例: たろう" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="form-field">
          <label>生年月日</label>
          <div className="birthday-input-row">
            <input
              className="birthday-text"
              inputMode="numeric"
              placeholder="例: 19970523"
              value={birthdayInput}
              onChange={handleBirthdayChange}
            />
            <label htmlFor="birthday-calendar" className="calendar-btn" aria-label="カレンダーから選択">
              📅
            </label>
            <input
              id="birthday-calendar"
              type="date"
              value={form.birthday}
              onChange={handleCalendarChange}
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1, right: 0, top: 0 }}
            />
          </div>
          {age !== null && <p className="field-hint">{age}歳</p>}
          {birthdayInput.replace(/\D/g, '').length === 8 && !age && (
            <p className="field-hint" style={{ color: 'var(--danger)' }}>無効な日付です</p>
          )}
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>性別</label>
            <select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>
          <div className="form-field"><label>身長 (cm)</label><input type="number" placeholder="例: 170" value={form.height} onChange={(e) => set('height', e.target.value)} /></div>
        </div>
        <div className="form-field"><label>体重 (kg)</label><input type="number" step="0.1" placeholder="例: 65" value={form.weight} onChange={(e) => set('weight', e.target.value)} /></div>
        <div className="form-field"><label>活動レベル</label><select value={form.activity_level} onChange={(e) => set('activity_level', e.target.value)}>{ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      </div>

      <div className="card">
        <h3 className="card-title">目標設定</h3>
        <div className="form-field">
          <label>目標体重 (kg)</label>
          <input type="number" step="0.1" placeholder="例: 60" value={form.goal_weight} onChange={(e) => set('goal_weight', e.target.value)} />
        </div>
        <div className="form-field">
          <label>目標日</label>
          <input type="date" value={form.goal_date} onChange={(e) => set('goal_date', e.target.value)} />
        </div>
        {form.goal_weight && form.goal_date && form.weight && (
          <p className="field-hint" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
            {formatGoalDate(form.goal_date)}までに{form.goal_weight}kg（{Number(form.goal_weight) >= Number(form.weight) ? '+' : ''}{(Number(form.goal_weight) - Number(form.weight)).toFixed(1)}kg）
          </p>
        )}
      </div>

      {previewProfile && (
        <div className="card info-card">
          <h3 className="card-title">計算結果プレビュー</h3>
          <div className="info-rows">
            <div className="info-row"><span>基礎代謝 (BMR)</span><strong>{calcBMR(previewProfile).toLocaleString()} kcal</strong></div>
            <div className="info-row"><span>総消費カロリー (TDEE)</span><strong>{calcTDEE(previewProfile).toLocaleString()} kcal</strong></div>
            {goalDetails && goalDetails.days !== null && goalDetails.weightDiff !== null && (
              <>
                <div className="info-row">
                  <span>残り日数</span>
                  <strong>{goalDetails.days > 0 ? `${goalDetails.days}日` : '期限切れ'}</strong>
                </div>
                <div className="info-row">
                  <span>1日あたりの調整</span>
                  <strong style={{ color: goalDetails.dailyAdjustment < 0 ? 'var(--accent)' : '#4CAF50' }}>
                    {goalDetails.dailyAdjustment > 0 ? '+' : ''}{goalDetails.dailyAdjustment.toLocaleString()} kcal
                  </strong>
                </div>
              </>
            )}
            <div className="info-row highlight">
              <span>目標カロリー / 日</span>
              <strong>{goalDetails ? goalDetails.target.toLocaleString() : calcTDEE(previewProfile).toLocaleString()} kcal</strong>
            </div>
          </div>
          <p className="info-note">＊ Mifflin-St Jeor 式 / 脂肪1kg=7,200kcal で計算</p>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}
      <button className="btn-primary large" onClick={handleSave}>{saved ? '✓ 保存しました' : 'プロフィールを保存'}</button>

      <button
        style={{ width: '100%', background: 'none', border: '1px solid #E0E0E0', borderRadius: 10, padding: 13, marginTop: 12, color: '#757575', cursor: 'pointer', fontSize: 14 }}
        onClick={onLogout}
      >
        ログアウト
      </button>
    </div>
  );
}
