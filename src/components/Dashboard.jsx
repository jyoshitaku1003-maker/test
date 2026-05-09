import { useState, useEffect } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceArea, ResponsiveContainer,
} from 'recharts';
import { calcBMR, calcTDEE, calcTargetCalories, sumCalories } from '../utils/calculations';
import { getFoodByDate, getExerciseByDate, getWeightLog, getFoodDailySummary, getExerciseDailySummary, todayStr } from '../utils/api';

function getLast14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const intake = payload.find((p) => p.dataKey === 'intake')?.value ?? 0;
  const burn = payload.find((p) => p.dataKey === 'burn')?.value ?? 0;
  const diff = intake - burn;
  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#FF7043' }}>摂取: {intake.toLocaleString()} kcal</p>
      <p style={{ color: '#4CAF50' }}>消費: {burn.toLocaleString()} kcal</p>
      <p style={{ color: diff > 0 ? '#F44336' : '#4CAF50', fontWeight: 700 }}>
        {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()} kcal
      </p>
    </div>
  );
};

export default function Dashboard({ profile, onTabChange }) {
  const today = todayStr();
  const [intake, setIntake] = useState(0);
  const [burned, setBurned] = useState(0);
  const [todayWeight, setTodayWeight] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    getFoodByDate(today).then((f) => setIntake(sumCalories(f))).catch(() => {});
    getExerciseByDate(today).then((e) => setBurned(sumCalories(e))).catch(() => {});
    getWeightLog().then((log) => {
      const tw = log.find((w) => w.date === today) || (log.length ? log[log.length - 1] : null);
      setTodayWeight(tw);
    }).catch(() => {});
  }, [today]);

  useEffect(() => {
    if (!profile) return;
    const dates = getLast14Days();
    const from = dates[0];
    const to = dates[dates.length - 1];
    const tdee = calcTDEE({ ...profile, activityLevel: profile.activity_level });

    Promise.all([
      getFoodDailySummary(from, to).catch(() => []),
      getExerciseDailySummary(from, to).catch(() => []),
    ]).then(([foodSummary, exerciseSummary]) => {
      setChartData(dates.map((date) => {
        const d = new Date(date + 'T00:00:00');
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        const foodEntry = foodSummary.find((f) => f.date === date);
        const exEntry = exerciseSummary.find((e) => e.date === date);
        const intakeKcal = foodEntry?.calories ?? null;
        const exercise = exEntry?.calories ?? 0;
        const burn = tdee + exercise;
        return { date, label, intake: intakeKcal, burn };
      }));
    });
  }, [profile]);

  const currentWeight = todayWeight?.weight || profile?.weight;
  const p = profile && currentWeight ? { ...profile, weight: currentWeight, activityLevel: profile.activity_level } : null;
  const target = p ? calcTargetCalories(p) : 2000;
  const bmr = p ? calcBMR(p) : null;
  const tdee = p ? calcTDEE(p) : null;
  const net = intake - burned;
  const remaining = target - net;

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

      {/* 今日のサマリー */}
      <div className="card">
        <h3 className="card-title">今日のカロリー収支</h3>
        <div className="calorie-rows" style={{ marginBottom: 12 }}>
          <div className="calorie-row">
            <span className="dot" style={{ background: '#FF7043' }} /><span>摂取</span>
            <strong>{intake.toLocaleString()} kcal</strong>
          </div>
          <div className="calorie-row">
            <span className="dot" style={{ background: '#4CAF50' }} /><span>運動消費</span>
            <strong>-{burned.toLocaleString()} kcal</strong>
          </div>
          <div className="calorie-row">
            <span className="dot" style={{ background: '#E0E0E0' }} /><span>残り目標</span>
            <strong style={{ color: remaining < 0 ? '#F44336' : 'inherit' }}>
              {remaining.toLocaleString()} kcal
            </strong>
          </div>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((net / target) * 100))}%`, background: net > target ? '#F44336' : '#FF7043' }} />
          </div>
          <span className="progress-label">目標 {target.toLocaleString()} kcal の {Math.min(100, Math.round((net / target) * 100))}%</span>
        </div>
      </div>

      {/* 14日間トレンド */}
      <div className="card">
        <h3 className="card-title">14日間のカロリー推移</h3>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          緑=消費&gt;摂取（減量ペース）　赤=摂取&gt;消費（増量ペース）
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval={1}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />

            {/* 日ごとに緑/赤のエリアを塗る */}
            {chartData.map((d, i) => {
              if (d.intake === null || i === chartData.length - 1) return null;
              const next = chartData[i + 1];
              if (next.intake === null) return null;
              const isDeficit = d.intake <= d.burn;
              return (
                <ReferenceArea
                  key={d.date}
                  x1={d.label}
                  x2={next.label}
                  y1={Math.min(d.intake, d.burn)}
                  y2={Math.max(d.intake, d.burn)}
                  fill={isDeficit ? 'rgba(76,175,80,0.25)' : 'rgba(244,67,54,0.25)'}
                  strokeOpacity={0}
                />
              );
            })}

            <Line
              type="monotone"
              dataKey="burn"
              stroke="#4CAF50"
              strokeWidth={2}
              dot={false}
              name="消費カロリー"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="intake"
              stroke="#FF7043"
              strokeWidth={2}
              dot={{ r: 3, fill: '#FF7043' }}
              name="摂取カロリー"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

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
          <strong>{currentWeight ?? '-'}</strong>
          <span className="metric-unit">kg</span>
        </div>
      </div>

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
