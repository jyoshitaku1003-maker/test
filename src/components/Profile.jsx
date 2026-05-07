import { useState } from 'react';
import { saveProfile } from '../utils/storage';
import { calcBMR, calcTDEE, calcTargetCalories } from '../utils/calculations';

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

export default function Profile({ profile, onSave }) {
  const [form, setForm] = useState(
    profile || {
      name: '',
      age: '',
      gender: 'male',
      height: '',
      weight: '',
      activityLevel: 'moderate',
      goal: 'lose',
      openaiApiKey: '',
    }
  );
  const [saved, setSaved] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    saveProfile(form);
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isComplete = form.name && form.age && form.height && form.weight;
  const previewProfile = isComplete
    ? { ...form, age: Number(form.age), height: Number(form.height), weight: Number(form.weight) }
    : null;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>プロフィール設定</h1>
      </div>

      <div className="card">
        <h3 className="card-title">基本情報</h3>
        <div className="form-field">
          <label>名前</label>
          <input placeholder="例: 田中 太郎" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>年齢</label>
            <input type="number" placeholder="例: 30" value={form.age} onChange={(e) => set('age', e.target.value)} />
          </div>
          <div className="form-field">
            <label>性別</label>
            <select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>身長 (cm)</label>
            <input type="number" placeholder="例: 170" value={form.height} onChange={(e) => set('height', e.target.value)} />
          </div>
          <div className="form-field">
            <label>体重 (kg)</label>
            <input type="number" step="0.1" placeholder="例: 65" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
          </div>
        </div>
        <div className="form-field">
          <label>活動レベル</label>
          <select value={form.activityLevel} onChange={(e) => set('activityLevel', e.target.value)}>
            {ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>目標</label>
          <select value={form.goal} onChange={(e) => set('goal', e.target.value)}>
            {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* BMR/TDEE Preview */}
      {previewProfile && (
        <div className="card info-card">
          <h3 className="card-title">計算結果プレビュー</h3>
          <div className="info-rows">
            <div className="info-row">
              <span>基礎代謝 (BMR)</span>
              <strong>{calcBMR(previewProfile).toLocaleString()} kcal</strong>
            </div>
            <div className="info-row">
              <span>総消費カロリー (TDEE)</span>
              <strong>{calcTDEE(previewProfile).toLocaleString()} kcal</strong>
            </div>
            <div className="info-row highlight">
              <span>目標カロリー / 日</span>
              <strong>{calcTargetCalories(previewProfile).toLocaleString()} kcal</strong>
            </div>
          </div>
          <p className="info-note">
            ＊ Mifflin-St Jeor 式で計算。食事・運動記録で毎日管理することで目標体重に近づきます。
          </p>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">AI機能設定</h3>
        <p className="section-desc">
          写真・レシート・テキストから食事を自動解析するにはOpenAI APIキーが必要です。
          設定しない場合は手動入力のみ使用できます。
        </p>
        <div className="form-field">
          <label>OpenAI APIキー</label>
          <input
            type="password"
            placeholder="sk-..."
            value={form.openaiApiKey}
            onChange={(e) => set('openaiApiKey', e.target.value)}
          />
        </div>
      </div>

      <button className="btn-primary large" onClick={handleSave}>
        {saved ? '✓ 保存しました' : 'プロフィールを保存'}
      </button>
    </div>
  );
}
