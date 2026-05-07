import { useState, useEffect } from 'react';
import { addExerciseEntry, deleteExerciseEntry, getExerciseByDate, todayStr } from '../utils/storage';
import { EXERCISE_PRESETS, estimateCaloriesBurned } from '../utils/calculations';

export default function ExerciseLog({ profile }) {
  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [error, setError] = useState('');

  const weight = profile?.weight || 60;

  useEffect(() => {
    setEntries(getExerciseByDate(date));
  }, [date]);

  const refresh = () => setEntries(getExerciseByDate(date));

  const selectPreset = (preset) => {
    setName(preset.name);
    if (duration) {
      setCalories(String(estimateCaloriesBurned(preset.met, Number(duration), weight)));
    }
  };

  const handleDurationChange = (val) => {
    setDuration(val);
    const preset = EXERCISE_PRESETS.find((p) => p.name === name);
    if (preset && val) {
      setCalories(String(estimateCaloriesBurned(preset.met, Number(val), weight)));
    }
  };

  const handleAdd = () => {
    if (!name || !duration || !calories) { setError('すべての項目を入力してください'); return; }
    addExerciseEntry({
      date,
      name,
      duration: Number(duration),
      calories: Number(calories),
    });
    setName(''); setDuration(''); setCalories(''); setError('');
    refresh();
    setShowModal(false);
  };

  const handleDelete = (id) => {
    deleteExerciseEntry(id);
    refresh();
  };

  const totalBurned = entries.reduce((s, e) => s + e.calories, 0);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>運動記録</h1>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="date-picker" />
      </div>

      <div className="total-bar">
        <span>合計消費カロリー</span>
        <strong style={{ color: '#4CAF50' }}>{totalBurned.toLocaleString()} kcal</strong>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>🏃</div>
          <p>今日の運動記録はありません</p>
        </div>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="list-item">
            <div className="list-item-info">
              <span className="list-item-name">{e.name}</span>
              <span className="list-item-meta">{e.duration} 分</span>
            </div>
            <div className="list-item-right">
              <strong className="calorie-badge green">{e.calories} kcal</strong>
              <button className="icon-btn danger" onClick={() => handleDelete(e.id)}>✕</button>
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => { setShowModal(true); setError(''); }}>＋ 運動を追加</button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>運動を記録</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <p className="section-label">よく使う運動</p>
            <div className="preset-grid">
              {EXERCISE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  className={`preset-btn ${name === p.name ? 'active' : ''}`}
                  onClick={() => selectPreset(p)}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="form-field">
              <label>運動名</label>
              <input placeholder="例: テニス" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>時間 (分)</label>
                <input type="number" placeholder="30" value={duration} onChange={(e) => handleDurationChange(e.target.value)} />
              </div>
              <div className="form-field">
                <label>消費カロリー (kcal)</label>
                <input type="number" placeholder="自動計算" value={calories} onChange={(e) => setCalories(e.target.value)} />
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn-primary" onClick={handleAdd}>追加</button>
          </div>
        </div>
      )}
    </div>
  );
}
