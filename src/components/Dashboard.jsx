import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { calcBMR, calcTDEE, calcTargetCalories, sumCalories } from '../utils/calculations';
import { getFoodByDate, getExerciseByDate, getWeightLog, todayStr } from '../utils/storage';

export default function Dashboard({ profile, onTabChange }) {
  const today = todayStr();

  const { intake, burned, target, bmr, tdee, todayWeight } = useMemo(() => {
    const foods = getFoodByDate(today);
    const exercises = getExerciseByDate(today);
    const weights = getWeightLog();
    const latestWeight = weights.length ? weights[weights.length - 1] : null;
    const todayWeight = weights.find((w) => w.date === today) || latestWeight;

    if (!profile) {
      return { intake: sumCalories(foods), burned: sumCalories(exercises), target: 2000, bmr: null, tdee: null, todayWeight };
    }

    const currentWeight = todayWeight?.weight || profile.weight;
    const p = { ...profile, weight: currentWeight };

    return {
      intake: sumCalories(foods),
      burned: sumCalories(exercises),
      target: calcTargetCalories(p),
      bmr: calcBMR(p),
      tdee: calcTDEE(p),
      todayWeight,
    };
  }, [profile, today]);

  const net = intake - burned;
  const remaining = target - net;
  const progress = Math.min(100, Math.round((net / target) * 100));

  const pieData = [
    { name: '摂取', value: intake },
    { name: '消費(運動)', value: burned },
    { name: '残り', value: Math.max(0, remaining) },
  ];
  const COLORS = ['#FF7043', '#4CAF50', '#E0E0E0'];

  const dateLabel = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  if (!profile) {
    return (
      <div className="screen">
        <div className="card center-card">
          <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
          <h2>ようこそ！</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            まずプロフィールを設定して<br />基礎代謝・目標カロリーを計算しましょう
          </p>
          <button className="btn-primary" onClick={() => onTabChange('profile')}>
            プロフィールを設定する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>ダッシュボード</h1>
        <p className="date-label">{dateLabel}</p>
      </div>

      {/* Calorie summary */}
      <div className="card">
        <h3 className="card-title">今日のカロリー収支</h3>
        <div className="calorie-main">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v} kcal`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="calorie-info">
            <div className="calorie-center-label">
              <span className="big-num" style={{ color: net > target ? '#F44336' : '#4CAF50' }}>
                {net.toLocaleString()}
              </span>
              <span className="unit">kcal 摂取正味</span>
            </div>
            <div className="calorie-rows">
              <div className="calorie-row">
                <span className="dot" style={{ background: '#FF7043' }} />
                <span>摂取</span>
                <strong>{intake.toLocaleString()} kcal</strong>
              </div>
              <div className="calorie-row">
                <span className="dot" style={{ background: '#4CAF50' }} />
                <span>運動消費</span>
                <strong>-{burned.toLocaleString()} kcal</strong>
              </div>
              <div className="calorie-row">
                <span className="dot" style={{ background: '#E0E0E0' }} />
                <span>残り目標</span>
                <strong style={{ color: remaining < 0 ? '#F44336' : 'inherit' }}>
                  {remaining.toLocaleString()} kcal
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="progress-bar-wrap">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background: progress > 100 ? '#F44336' : '#FF7043',
              }}
            />
          </div>
          <span className="progress-label">目標 {target.toLocaleString()} kcal の {progress}%</span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="metrics-row">
        <div className="metric-card">
          <span className="metric-icon">🔥</span>
          <span className="metric-label">基礎代謝</span>
          <strong>{bmr?.toLocaleString() ?? '-'}</strong>
          <span className="metric-unit">kcal</span>
        </div>
        <div className="metric-card">
          <span className="metric-icon">⚡</span>
          <span className="metric-label">TDEE</span>
          <strong>{tdee?.toLocaleString() ?? '-'}</strong>
          <span className="metric-unit">kcal</span>
        </div>
        <div className="metric-card">
          <span className="metric-icon">⚖️</span>
          <span className="metric-label">体重</span>
          <strong>{todayWeight?.weight ?? profile.weight}</strong>
          <span className="metric-unit">kg</span>
        </div>
      </div>

      {/* Quick add */}
      <div className="quick-btns">
        <button className="quick-btn" onClick={() => onTabChange('food')}>
          <span>🍽️</span> 食事を記録
        </button>
        <button className="quick-btn" onClick={() => onTabChange('exercise')}>
          <span>🏃</span> 運動を記録
        </button>
        <button className="quick-btn" onClick={() => onTabChange('weight')}>
          <span>⚖️</span> 体重を記録
        </button>
      </div>
    </div>
  );
}
