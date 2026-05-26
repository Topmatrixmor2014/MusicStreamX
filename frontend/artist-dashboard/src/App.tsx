import { useState } from 'react';
import { RoyaltyAnalyticsDashboard } from './pages/RoyaltyAnalyticsDashboard';
import { TrackUpload } from './components/TrackUpload';
import { RoyaltySettings } from './pages/RoyaltySettings';
import { WithdrawEarnings } from './pages/WithdrawEarnings';

type Page = 'analytics' | 'upload' | 'royalty-settings' | 'withdraw';

const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: 'analytics', label: '📊 Analytics' },
  { id: 'upload', label: '🎵 Upload Track' },
  { id: 'royalty-settings', label: '⚙️ Royalty Settings' },
  { id: 'withdraw', label: '💸 Withdraw' },
];

function App() {
  const [page, setPage] = useState<Page>('analytics');

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f7fafc' }}>
      <nav
        style={{
          background: '#1a202c',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginRight: 16, padding: '14px 0' }}>
          🎵 Artist Dashboard
        </span>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            data-testid={`nav-${item.id}`}
            onClick={() => setPage(item.id)}
            style={{
              background: 'none',
              border: 'none',
              color: page === item.id ? '#667eea' : '#a0aec0',
              fontWeight: page === item.id ? 700 : 400,
              fontSize: 14,
              cursor: 'pointer',
              padding: '14px 12px',
              borderBottom: page === item.id ? '2px solid #667eea' : '2px solid transparent',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main>
        {page === 'analytics' && <RoyaltyAnalyticsDashboard />}
        {page === 'upload' && <TrackUpload />}
        {page === 'royalty-settings' && <RoyaltySettings />}
        {page === 'withdraw' && <WithdrawEarnings />}
      </main>
    </div>
  );
}

export default App;
