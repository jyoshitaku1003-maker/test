import { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import FoodLog from './components/FoodLog';
import ExerciseLog from './components/ExerciseLog';
import WeightLog from './components/WeightLog';
import Profile from './components/Profile';
import { getProfile } from './utils/storage';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [profile, setProfile] = useState(getProfile);

  const handleSaveProfile = (p) => setProfile(p);

  return (
    <div className="app">
      <main className="main">
        {tab === 'dashboard' && <Dashboard profile={profile} onTabChange={setTab} />}
        {tab === 'food' && <FoodLog profile={profile} />}
        {tab === 'exercise' && <ExerciseLog profile={profile} />}
        {tab === 'weight' && <WeightLog profile={profile} />}
        {tab === 'profile' && <Profile profile={profile} onSave={handleSaveProfile} />}
      </main>
      <Navigation tab={tab} setTab={setTab} />
    </div>
  );
}
