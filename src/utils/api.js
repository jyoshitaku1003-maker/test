const BASE = '/api';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(t) {
  localStorage.setItem('token', t);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'エラーが発生しました');
  return data;
}

// Auth
export const register = (email, password) =>
  request('POST', '/auth/register', { email, password });

export const login = (email, password) =>
  request('POST', '/auth/login', { email, password });

// Profile
export const getProfile = () => request('GET', '/profile');
export const saveProfile = (profile) => request('PUT', '/profile', profile);

// Weight
export const getWeightLog = () => request('GET', '/weight');
export const addWeightEntry = (entry) => request('POST', '/weight', entry);
export const deleteWeightEntry = (date) => request('DELETE', `/weight/${date}`);

// Food
export const getFoodByDate = (date) => request('GET', `/food?date=${date}`);
export const addFoodEntry = (entry) => request('POST', '/food', entry);
export const deleteFoodEntry = (id) => request('DELETE', `/food/${id}`);

// Exercise
export const getExerciseByDate = (date) => request('GET', `/exercise?date=${date}`);
export const addExerciseEntry = (entry) => request('POST', '/exercise', entry);
export const deleteExerciseEntry = (id) => request('DELETE', `/exercise/${id}`);

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
