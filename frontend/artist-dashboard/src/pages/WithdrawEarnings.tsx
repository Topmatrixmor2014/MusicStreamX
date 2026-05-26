import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

// Demo artist ID — in production comes from auth context
const DEMO_ARTIST_ID = '3f08afa9-a277-4400-97f0-625307980c0c';

interface EarningsSummary {
  availableBalance: number; // XLM
  pendingBalance: number;   // XLM (not yet settled)
  totalWithdrawn: number;   // XLM lifetime
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 24,
};

export function WithdrawEarnings() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [withdrawError, setWithdrawError] = useState('');
  const [txHash, setTxHash] = useState('');

  const loadSummary = useCallback(async () => {
    setLoadError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/artists/${DEMO_ARTIST_ID}/earnings`);
      setSummary(data);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : String(err);
      setLoadError(msg);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  async function handleWithdraw() {
    if (!summary || summary.availableBalance <= 0) return;
    setWithdrawStatus('pending');
    setWithdrawError('');
    setTxHash('');
    try {
      const { data } = await axios.post(`${API_BASE}/artists/${DEMO_ARTIST_ID}/withdraw`);
      setTxHash(data.txHash ?? '');
      setWithdrawStatus('success');
      await loadSummary(); // refresh balance
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : String(err);
      setWithdrawError(msg);
      setWithdrawStatus('error');
    }
  }

  return (
    <div data-testid="withdraw-earnings" style={{ padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>💸 Withdraw Earnings</h1>
      <p style={{ color: '#718096', marginBottom: 24 }}>
        View your available XLM balance and withdraw to your Stellar wallet.
      </p>

      {loadError && (
        <p data-testid="load-error" style={{ color: '#e53e3e' }}>{loadError}</p>
      )}

      {summary && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div data-testid="available-balance" style={{ ...card, textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#718096', fontSize: 13 }}>Available</p>
              <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, color: '#48bb78' }}>
                {summary.availableBalance.toFixed(4)} XLM
              </p>
            </div>
            <div data-testid="pending-balance" style={{ ...card, textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#718096', fontSize: 13 }}>Pending</p>
              <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, color: '#ed8936' }}>
                {summary.pendingBalance.toFixed(4)} XLM
              </p>
            </div>
            <div data-testid="total-withdrawn" style={{ ...card, textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#718096', fontSize: 13 }}>Total Withdrawn</p>
              <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, color: '#667eea' }}>
                {summary.totalWithdrawn.toFixed(4)} XLM
              </p>
            </div>
          </div>

          <div style={{ ...card, maxWidth: 520 }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#4a5568' }}>
              Withdrawals are sent directly to your registered Stellar payout wallet via XLM
              micropayment. Minimum withdrawal: 0.0001 XLM.
            </p>
            <button
              data-testid="withdraw-button"
              onClick={handleWithdraw}
              disabled={withdrawStatus === 'pending' || summary.availableBalance <= 0}
              style={{
                background: summary.availableBalance > 0 ? '#48bb78' : '#a0aec0',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                cursor: summary.availableBalance > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              {withdrawStatus === 'pending'
                ? 'Processing…'
                : `Withdraw ${summary.availableBalance.toFixed(4)} XLM`}
            </button>

            {withdrawStatus === 'success' && (
              <div data-testid="withdraw-success" style={{ marginTop: 12, color: '#38a169' }}>
                <p>✅ Withdrawal submitted!</p>
                {txHash && <p style={{ fontSize: 12 }}>Tx: {txHash}</p>}
              </div>
            )}
            {withdrawStatus === 'error' && (
              <p data-testid="withdraw-error" style={{ color: '#e53e3e', marginTop: 12 }}>
                {withdrawError}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
