import { useState, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

// Demo artist ID — in production comes from auth context
const DEMO_ARTIST_ID = '3f08afa9-a277-4400-97f0-625307980c0c';

interface RoyaltyConfig {
  royaltyRate: number;   // basis points (0–5000)
  platformFee: number;  // basis points, read-only display
  walletAddress: string;
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 24,
  maxWidth: 520,
};

export function RoyaltySettings() {
  const [form, setForm] = useState<RoyaltyConfig>({
    royaltyRate: 1000,
    platformFee: 500,
    walletAddress: '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'walletAddress' ? value : Number(value) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.royaltyRate < 1 || form.royaltyRate > 5000) {
      setErrorMsg('Royalty rate must be between 1 and 5000 basis points.');
      setStatus('error');
      return;
    }
    setStatus('saving');
    setErrorMsg('');
    try {
      await axios.put(`${API_BASE}/artists/${DEMO_ARTIST_ID}/royalty-settings`, {
        royaltyRate: form.royaltyRate,
        walletAddress: form.walletAddress,
      });
      setStatus('success');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : String(err);
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  return (
    <div data-testid="royalty-settings" style={{ padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>⚙️ Royalty Settings</h1>
      <p style={{ color: '#718096', marginBottom: 24 }}>
        Configure your per-stream royalty rate and payout wallet.
      </p>

      <div style={card}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="royaltyRate" style={{ fontWeight: 600 }}>
              Royalty Rate (basis points)
            </label>
            <p style={{ margin: '2px 0 6px', fontSize: 12, color: '#718096' }}>
              1 bp = 0.01 %. Max 5000 (50 %). Current: {(form.royaltyRate / 100).toFixed(2)} %
            </p>
            <input
              id="royaltyRate"
              data-testid="input-royaltyRate"
              name="royaltyRate"
              type="number"
              min={1}
              max={5000}
              value={form.royaltyRate}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600 }}>Platform Fee</label>
            <p style={{ margin: '2px 0 6px', fontSize: 12, color: '#718096' }}>
              Fixed at {(form.platformFee / 100).toFixed(2)} % — set by the platform.
            </p>
            <input
              data-testid="display-platformFee"
              type="text"
              value={`${form.platformFee} bps (${(form.platformFee / 100).toFixed(2)} %)`}
              readOnly
              style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', background: '#f7fafc' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="walletAddress" style={{ fontWeight: 600 }}>
              Payout Wallet Address (Stellar)
            </label>
            <input
              id="walletAddress"
              data-testid="input-walletAddress"
              name="walletAddress"
              type="text"
              value={form.walletAddress}
              onChange={handleChange}
              placeholder="G..."
              required
              style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            data-testid="save-button"
            type="submit"
            disabled={status === 'saving'}
            style={{
              background: '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {status === 'saving' ? 'Saving…' : 'Save Settings'}
          </button>
        </form>

        {status === 'success' && (
          <p data-testid="success-msg" style={{ color: '#38a169', marginTop: 12 }}>
            ✅ Royalty settings saved successfully.
          </p>
        )}
        {status === 'error' && (
          <p data-testid="error-msg" style={{ color: '#e53e3e', marginTop: 12 }}>
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
