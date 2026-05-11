import { useState, useEffect, useRef } from 'react';
import { addFoodEntry, deleteFoodEntry, getFoodByDate, todayStr, getFoodCorrections, saveFoodCorrection } from '../utils/api';
import { analyzeFoodText, analyzeFoodImage, fileToBase64 } from '../utils/openai';

const MEAL_TYPES = ['朝食', '昼食', '夕食', '間食'];

function AiResultItem({ item, index, onChange, onAdd, onRemove }) {
  return (
    <div className="ai-edit-item">
      <div className="ai-edit-header">
        <input
          className="ai-edit-name"
          value={item.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          placeholder="食品名"
        />
        <button className="icon-btn danger" onClick={() => onRemove(index)}>✕</button>
      </div>
      <div className="ai-edit-row">
        <div className="ai-edit-field">
          <span>kcal</span>
          <input type="number" value={item.calories} onChange={(e) => onChange(index, 'calories', e.target.value)} />
        </div>
        <div className="ai-edit-field">
          <span>P(g)</span>
          <input type="number" value={item.protein} onChange={(e) => onChange(index, 'protein', e.target.value)} />
        </div>
        <div className="ai-edit-field">
          <span>C(g)</span>
          <input type="number" value={item.carbs} onChange={(e) => onChange(index, 'carbs', e.target.value)} />
        </div>
        <div className="ai-edit-field">
          <span>F(g)</span>
          <input type="number" value={item.fat} onChange={(e) => onChange(index, 'fat', e.target.value)} />
        </div>
      </div>
      <button className="btn-outline-sm" style={{ marginTop: 6, width: '100%' }} onClick={() => onAdd(item)}>
        この1品を追加
      </button>
    </div>
  );
}

function FoodItem({ item, onDelete }) {
  return (
    <div className="list-item">
      <div className="list-item-info">
        <span className="list-item-name">{item.name}</span>
        <span className="list-item-meta">{item.mealType} · P:{item.protein}g C:{item.carbs}g F:{item.fat}g</span>
      </div>
      <div className="list-item-right">
        <strong className="calorie-badge">{item.calories} kcal</strong>
        <button className="icon-btn danger" onClick={() => onDelete(item.id)}>✕</button>
      </div>
    </div>
  );
}

export default function FoodLog({ profile }) {
  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState('manual');
  const [mealType, setMealType] = useState('昼食');
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [aiText, setAiText] = useState('');
  const [aiItems, setAiItems] = useState([]);
  const [corrections, setCorrections] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const refresh = () => getFoodByDate(date).then(setEntries).catch(() => {});

  useEffect(() => { refresh(); }, [date]);

  useEffect(() => {
    getFoodCorrections().then((list) => {
      const map = {};
      list.forEach((c) => { map[c.name.toLowerCase()] = c; });
      setCorrections(map);
    }).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    await deleteFoodEntry(id).catch(() => {});
    refresh();
  };

  const handleManualAdd = async () => {
    if (!form.name || !form.calories) { setError('食品名とカロリーは必須です'); return; }
    await addFoodEntry({ date, mealType, name: form.name, calories: Number(form.calories), protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0, fat: Number(form.fat) || 0 });
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setError('');
    refresh();
    setShowModal(false);
  };

  const applyCorrections = (items) =>
    items.map((item) => {
      const c = corrections[item.name.toLowerCase()];
      return c ? { ...item, calories: c.calories, protein: c.protein, carbs: c.carbs, fat: c.fat } : item;
    });

  const handleAiAnalyze = async () => {
    if (!aiText.trim()) { setError('テキストを入力してください'); return; }
    setLoading(true); setError('');
    try {
      const result = await analyzeFoodText(aiText);
      setAiItems(applyCorrections(result.items || []));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const handleImageAnalyze = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError('');
    try {
      const b64 = await fileToBase64(file);
      const result = await analyzeFoodImage(b64, file.type);
      setAiItems(applyCorrections(result.items || []));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const updateAiItem = (i, field, val) => {
    setAiItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };

  const removeAiItem = (i) => setAiItems((prev) => prev.filter((_, idx) => idx !== i));

  const persistItem = async (item) => {
    const entry = { name: item.name, calories: Number(item.calories) || 0, protein: Number(item.protein) || 0, carbs: Number(item.carbs) || 0, fat: Number(item.fat) || 0 };
    await addFoodEntry({ date, mealType, ...entry });
    saveFoodCorrection(entry).catch(() => {});
    setCorrections((prev) => ({ ...prev, [entry.name.toLowerCase()]: entry }));
  };

  const addAiItem = async (item) => {
    await persistItem(item);
    refresh();
  };

  const addAllAiItems = async () => {
    for (const item of aiItems) await persistItem(item);
    setAiItems([]); setAiText(''); setShowModal(false); refresh();
  };

  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);
  const byMeal = MEAL_TYPES.map((mt) => ({ label: mt, items: entries.filter((e) => e.mealType === mt) }));

  return (
    <div className="screen screen-fab">
      <div className="screen-header">
        <h1>食事記録</h1>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="date-picker" />
      </div>

      <div className="total-bar">
        <span>合計摂取カロリー</span>
        <strong>{totalCalories.toLocaleString()} kcal</strong>
      </div>

      {byMeal.map(({ label, items }) => (
        <div key={label} className="meal-section">
          <div className="meal-header">
            <span className="meal-label">{label}</span>
            <span className="meal-total">{items.reduce((s, e) => s + e.calories, 0)} kcal</span>
          </div>
          {items.length === 0 ? <p className="empty-hint">記録なし</p> : items.map((item) => <FoodItem key={item.id} item={item} onDelete={handleDelete} />)}
        </div>
      ))}

      <button className="fab" onClick={() => { setShowModal(true); setMode('manual'); setAiItems([]); setAiText(''); setError(''); }}>＋ 食事を追加</button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>食事を記録</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="segmented">
              {['manual', 'text', 'image'].map((m) => (
                <button key={m} className={`seg-btn ${mode === m ? 'active' : ''}`} onClick={() => { setMode(m); setAiItems([]); setError(''); }}>
                  {m === 'manual' ? '手動入力' : m === 'text' ? 'テキスト/メモ' : '写真/レシート'}
                </button>
              ))}
            </div>
            <div className="form-field">
              <label>食事タイプ</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                {MEAL_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            {mode === 'manual' && (
              <>
                <div className="form-field"><label>食品名 *</label><input placeholder="例: 鶏むね肉 200g" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-field"><label>カロリー (kcal) *</label><input type="number" placeholder="例: 330" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></div>
                <div className="form-row three-col">
                  <div className="form-field"><label>タンパク質 (g)</label><input type="number" placeholder="0" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} /></div>
                  <div className="form-field"><label>炭水化物 (g)</label><input type="number" placeholder="0" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} /></div>
                  <div className="form-field"><label>脂質 (g)</label><input type="number" placeholder="0" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} /></div>
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button className="btn-primary" onClick={handleManualAdd}>追加</button>
              </>
            )}
            {mode === 'text' && (
              <>
                <div className="form-field"><label>食事のメモ・テキスト</label><textarea rows={4} placeholder="例: 朝ごはん　ご飯1杯、味噌汁、卵焼き2個" value={aiText} onChange={(e) => setAiText(e.target.value)} /></div>
                {error && <p className="error-msg">{error}</p>}
                <button className="btn-primary" onClick={handleAiAnalyze} disabled={loading}>{loading ? '解析中...' : 'AIで解析'}</button>
                {aiItems.length > 0 && (
                  <div className="ai-results">
                    <p className="ai-results-title">解析結果（修正できます）</p>
                    {aiItems.map((item, i) => (
                      <AiResultItem key={i} item={item} index={i} onChange={updateAiItem} onAdd={addAiItem} onRemove={removeAiItem} />
                    ))}
                    <button className="btn-primary" style={{ marginTop: 8 }} onClick={addAllAiItems}>すべて追加</button>
                  </div>
                )}
              </>
            )}
            {mode === 'image' && (
              <>
                <div className="upload-area" onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageAnalyze} />
                  <div className="upload-icon">📷</div>
                  <p>食事の写真またはレシートを選択</p>
                  <span className="upload-hint">カメラ撮影 / カメラロールから選択</span>
                </div>
                {loading && <p className="loading-msg">画像を解析中...</p>}
                {error && <p className="error-msg">{error}</p>}
                {aiItems.length > 0 && (
                  <div className="ai-results">
                    <p className="ai-results-title">解析結果（修正できます）</p>
                    {aiItems.map((item, i) => (
                      <AiResultItem key={i} item={item} index={i} onChange={updateAiItem} onAdd={addAiItem} onRemove={removeAiItem} />
                    ))}
                    <button className="btn-primary" style={{ marginTop: 8 }} onClick={addAllAiItems}>すべて追加</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
