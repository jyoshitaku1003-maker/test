const KEYS = {
  PROFILE: 'dt_profile',
  WEIGHT: 'dt_weight',
  FOOD: 'dt_food',
  EXERCISE: 'dt_exercise',
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Profile
export function getProfile() {
  return load(KEYS.PROFILE);
}

export function saveProfile(profile) {
  save(KEYS.PROFILE, profile);
}

// Weight log: [{ date: 'YYYY-MM-DD', weight: number }]
export function getWeightLog() {
  return load(KEYS.WEIGHT) || [];
}

export function addWeightEntry(entry) {
  const log = getWeightLog().filter((e) => e.date !== entry.date);
  log.push(entry);
  log.sort((a, b) => a.date.localeCompare(b.date));
  save(KEYS.WEIGHT, log);
}

export function deleteWeightEntry(date) {
  save(KEYS.WEIGHT, getWeightLog().filter((e) => e.date !== date));
}

// Food log: [{ id, date, mealType, name, calories, protein, carbs, fat }]
export function getFoodLog() {
  return load(KEYS.FOOD) || [];
}

export function addFoodEntry(entry) {
  const log = getFoodLog();
  log.push({ ...entry, id: Date.now().toString() });
  save(KEYS.FOOD, log);
}

export function deleteFoodEntry(id) {
  save(KEYS.FOOD, getFoodLog().filter((e) => e.id !== id));
}

export function getFoodByDate(date) {
  return getFoodLog().filter((e) => e.date === date);
}

// Exercise log: [{ id, date, name, duration, calories }]
export function getExerciseLog() {
  return load(KEYS.EXERCISE) || [];
}

export function addExerciseEntry(entry) {
  const log = getExerciseLog();
  log.push({ ...entry, id: Date.now().toString() });
  save(KEYS.EXERCISE, log);
}

export function deleteExerciseEntry(id) {
  save(KEYS.EXERCISE, getExerciseLog().filter((e) => e.id !== id));
}

export function getExerciseByDate(date) {
  return getExerciseLog().filter((e) => e.date === date);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
