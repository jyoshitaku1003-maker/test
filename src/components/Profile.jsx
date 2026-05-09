import { useState, useRef } from 'react';
import { saveProfile } from '../utils/api';
import { calcBMR, calcTDEE, calcTargetCalories, calcAge } from '../utils/calculations';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: '座り仕事が多い (×1.2)' },
  { value: 'light', label: '軽い運動 (週1〜3回) (×1.375)' },
  { value: 'moderate', label: '中程度の運動 (週3〜5回) (×1.55)' },
  { value: 'active', label: '激しい運動 (週6〜7回) (×1.725)' },
  { value: 'very_active', label: '非常に激しい運動 (×1.9)' },
];

const GOAL_OPTIONS = [
  { value: 'lose', label: '体重を減らす (-500 kcal/日)' },
  { value: 'maintain', label: '体重を維持する' },
  { value: 'gain', label: '体重を増やす (+500 kcal/日)' },
];

// YYYY-MM-DD → YYYY/MM/DD (display)
function toDisplay(value) {
  if (!value) return '';
  const d = value.replace(/-/g, '');
  if (d.length === 8) return `${d.slice(0,4)}/${d.slice(4,6)}/${d.slice(6,8)}`;
  return value.replace(/-/g, '/');
}

// raw digit input → formatted display string
function formatDigits(digits) {
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0,4)}/${digits.slice(4)}`;
  return `${digits.slice(0,4)}/${digits.slice(4,6)}/${digits.slice(6,8)}`;
}

// formatted display → YYYY-MM-DD (for storage)
function toValue(display) {
  const d = display.replace(/\D/g, '');
  if (d.length === 8) return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
  return '';
}

function isValidDate(value) {
  if (!value) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

export default function Profile({ profile, onSave, onLogout }) {
  const [form, setForm] = useState(
    profile || { name: '', birthday: '', gender: 'male', height: '', weight: '', activity_level: 'moderate', goal: 'lose' }
  );
  const [birthdayInput, setBirthdayInput] = useState(() => toDisplay(profile?.birthday || ''));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const calendarRef = useRef(null);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleBirthdayChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const formatted = formatDigits(digits);
    setBirthdayInput(formatted);
    const value = toValue(formatted);
    if (value && isValidDate(value)) {
      set('birthday', value);
    } else {
      set('birthday', '');
    }
  };

  const handleCalendarChange = (e) => {
    const value = e.target.value; // YYYY-MM-DD
    if (value) {
      set('birthday', value);
      setBirthdayInput(toDisplay(value));
    }
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
            <button
              type="button"
              className="calendar-btn"
              onClick={() => calendarRef.current?.showPicker?.() || calendarRef.current?.click()}
              aria-label="カレンダーから選択"
            >
              📅
            </button>
            <input
              ref={calendarRef}
              type="date"
              value={form.birthday}
              onChange={handleCalendarChange}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
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
        <div className="form-field"><label>目標</label><select value={form.goal} onChange={(e) => set('goal', e.target.value)}>{GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      </div>

      {previewProfile && (
        <div className="card info-card">
          <h3 className="card-title">計算結果プレビュー</h3>
          <div className="info-rows">
            <div className="info-row"><span>基礎代謝 (BMR)</span><strong>{calcBMR(previewProfile).toLocaleString()} kcal</strong></div>
            <div className="info-row"><span>総消費カロリー (TDEE)</span><strong>{calcTDEE(previewProfile).toLocaleString()} kcal</strong></div>
            <div className="info-row highlight"><span>目標カロリー / 日</span><strong>{calcTargetCalories(previewProfile).toLocaleString()} kcal</strong></div>
          </div>
          <p className="info-note">＊ Mifflin-St Jeor 式で計算</p>
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
