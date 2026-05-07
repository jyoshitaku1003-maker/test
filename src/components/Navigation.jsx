export default function Navigation({ tab, setTab }) {
  const tabs = [
    { id: 'dashboard', label: 'ホーム', icon: '🏠' },
    { id: 'food', label: '食事', icon: '🍽️' },
    { id: 'exercise', label: '運動', icon: '🏃' },
    { id: 'weight', label: '体重', icon: '⚖️' },
    { id: 'profile', label: '設定', icon: '⚙️' },
  ];

  return (
    <nav className="nav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`nav-btn ${tab === t.id ? 'active' : ''}`}
          onClick={() => setTab(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
