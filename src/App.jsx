import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import FoodLog from './components/FoodLog';
import ExerciseLog from './components/ExerciseLog';
import WeightLog from './components/WeightLog';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { isLoggedIn, getProfile, clearToken } from './utils/api';

export default function App() {
  const [authed, setAuthed] = useState(isLoggedIn);
  const [tab, setTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!authed) return;
    getProfile().then((p) => setProfile(p)).catch(() => {});
  }, [authed]);

  const handleAuth = () => {
    setAuthed(true);
  };

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    setProfile(null);
  };

  if (!authed) return <Auth onAuth={handleAuth} />;

  return (
    <div className="app">
      <main className="main">
        {tab === 'dashboard' && <Dashboard profile={profile} onTabChange={setTab} />}
        {tab === 'food' && <FoodLog profile={profile} />}
        {tab === 'exercise' && <ExerciseLog profile={profile} />}
        {tab === 'weight' && <WeightLog profile={profile} />}
        {tab === 'profile' && (
          <Profile profile={profile} onSave={(p) => setProfile(p)} onLogout={handleLogout} />
        )}
      </main>
      <Navigation tab={tab} setTab={setTab} />
    </div>
  );
}
