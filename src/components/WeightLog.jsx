import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { addWeightEntry, deleteWeightEntry, getWeightLog, todayStr } from '../utils/api';
import { calcBMI, bmiCategory } from '../utils/calculations';

export default function WeightLog({ profile }) {
  const [log, setLog] = useState([]);
  const [inputWeight, setInputWeight] = useState('');
  const [date, setDate] = useState(todayStr());
  const [error, setError] = useState('');

  const refresh = () => getWeightLog().then(setLog).catch(() => {});

  useEffect(() => { refresh(); }, []);

  const handleAdd = async () => {
    const w = parseFloat(inputWeight);
    if (!w || w < 20 || w > 300) { setError('正しい体重を入力してください (20〜300kg)'); return; }
    await addWeightEntry({ date, weight: w });
    setInputWeight(''); setError('');
    refresh();
  };

  const handleDelete = async (d) => {
    await deleteWeightEntry(d).catch(() => {});
    refresh();
  };

  const latest = log.length ? log[log.length - 1] : null;
  const first = log.length ? log[0] : null;
  const diff = latest && first && log.length > 1 ? (latest.weight - first.weight).toFixed(1) : null;
  const bmi = latest && profile ? calcBMI(latest.weight, profile.height) : null;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;
  const chartData = log.slice(-30).map((e) => ({ date: e.date.slice(5), 体重: e.weight }));

  return (
    <div className="screen">
      <div className="screen-header"><h1>体重記録</h1></div>

      <div className="card">
        <h3 className="card-title">今日の体重を記録</h3>
        <div className="form-row">
          <div className="form-field" style={{ flex: 1 }}><label>日付</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="form-field" style={{ flex: 1 }}><label>体重 (kg)</label><input type="number" step="0.1" placeholder={latest ? String(latest.weight) : '例: 65.5'} value={inputWeight} onChange={(e) => setInputWeight(e.target.value)} /></div>
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn-primary" onClick={handleAdd}>記録する</button>
      </div>

      {latest && (
        <div className="metrics-row">
          <div className="metric-card">
            <span className="metric-icon">⚖️</span><span className="metric-label">最新体重</span>
            <strong>{latest.weight}</strong><span className="metric-unit">kg</span>
          </div>
          {bmi && (
            <div className="metric-card">
              <span className="metric-icon">📊</span><span className="metric-label">BMI</span>
              <strong style={{ color: bmiInfo.color }}>{bmi}</strong><span className="metric-unit">{bmiInfo.label}</span>
            </div>
          )}
          {diff !== null && (
            <div className="metric-card">
              <span className="metric-icon">{Number(diff) < 0 ? '📉' : '📈'}</span>
              <span className="metric-label">変化</span>
              <strong style={{ color: Number(diff) <= 0 ? '#4CAF50' : '#F44336' }}>
                {Number(diff) > 0 ? '+' : ''}{diff}
              </strong>
              <span className="metric-unit">kg</span>
            </div>
          )}
        </div>
      )}

      {log.length > 1 && (
        <div className="card">
          <h3 className="card-title">体重グラフ（直近30日）</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `${v} kg`} />
              <Line type="monotone" dataKey="体重" stroke="#4CAF50" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">記録一覧</h3>
        {log.length === 0 ? <p className="empty-hint">記録がありません</p> : (
          [...log].reverse().slice(0, 20).map((e) => (
            <div key={e.date} className="list-item">
              <div className="list-item-info"><span className="list-item-name">{e.date}</span></div>
              <div className="list-item-right">
                <strong>{e.weight} kg</strong>
                <button className="icon-btn danger" onClick={() => handleDelete(e.date)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
