export function calcAge(birthday) {
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Mifflin-St Jeor formula
export function calcBMR(profile) {
  const { gender, weight, height, birthday } = profile;
  const age = calcAge(birthday);
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcTDEE(profile) {
  return Math.round(calcBMR(profile) * (ACTIVITY_FACTORS[profile.activityLevel] || 1.55));
}

export function calcGoalDetails(profile) {
  const tdee = calcTDEE(profile);
  const goalWeight = profile.goal_weight ? Number(profile.goal_weight) : null;
  const goalDate = profile.goal_date || null;

  if (!goalWeight || !goalDate) return { tdee, dailyAdjustment: 0, target: tdee, days: null, weightDiff: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(goalDate);
  targetDate.setHours(0, 0, 0, 0);
  const days = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));

  if (days <= 0) return { tdee, dailyAdjustment: 0, target: tdee, days: 0, weightDiff: null };

  const weightDiff = goalWeight - Number(profile.weight);
  const totalKcal = weightDiff * 7200;
  const dailyAdjustment = Math.round(totalKcal / days);
  const target = tdee + dailyAdjustment;

  return { tdee, dailyAdjustment, target, days, weightDiff };
}

export function calcTargetCalories(profile) {
  return calcGoalDetails(profile).target;
}

export function calcBMI(weight, height) {
  const hm = height / 100;
  return Math.round((weight / (hm * hm)) * 10) / 10;
}

export function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: '低体重', color: '#2196F3' };
  if (bmi < 25) return { label: '標準', color: '#4CAF50' };
  if (bmi < 30) return { label: '過体重', color: '#FF9800' };
  return { label: '肥満', color: '#F44336' };
}

export function sumCalories(entries) {
  return entries.reduce((s, e) => s + (e.calories || 0), 0);
}

// Common exercises (MET × weight × hours)
export const EXERCISE_PRESETS = [
  { name: 'ウォーキング', met: 3.5 },
  { name: 'ジョギング', met: 7.0 },
  { name: 'ランニング', met: 10.0 },
  { name: '自転車', met: 6.0 },
  { name: '水泳', met: 8.0 },
  { name: '筋トレ', met: 5.0 },
  { name: 'ヨガ', met: 2.5 },
  { name: 'サイクリング', met: 8.0 },
  { name: '縄跳び', met: 10.0 },
  { name: '階段昇降', met: 4.0 },
];

export function estimateCaloriesBurned(met, durationMin, weightKg) {
  return Math.round((met * weightKg * durationMin) / 60);
}
