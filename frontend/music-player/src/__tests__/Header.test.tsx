import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from '../components/Header';
import { useThemeStore } from '../store/themeStore';
import { useWalletStore } from '../store/walletStore';

vi.mock('../store/themeStore');
vi.mock('../store/walletStore');

const mockToggleDarkMode = vi.fn();

function setThemeState(isDarkMode = false) {
  vi.mocked(useThemeStore).mockReturnValue({ isDarkMode, toggleDarkMode: mockToggleDarkMode });
}

function setWalletState(overrides = {}) {
  vi.mocked(useWalletStore).mockReturnValue({
    isConnected: false,
    account: null,
    network: null,
    balance: null,
    isLoading: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
    ...overrides,
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Header', () => {
  it('renders the app title', () => {
    setThemeState();
    setWalletState();
    render(<Header />);
    expect(screen.getByText(/MusicStreamX/i)).toBeInTheDocument();
  });

  it('shows moon icon in light mode', () => {
    setThemeState(false);
    setWalletState();
    render(<Header />);
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });

  it('shows sun icon in dark mode', () => {
    setThemeState(true);
    setWalletState();
    render(<Header />);
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  it('calls toggleDarkMode when theme button is clicked', () => {
    setThemeState(false);
    setWalletState();
    render(<Header />);
    fireEvent.click(screen.getByText('🌙'));
    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('renders WalletConnect (connect button visible when disconnected)', () => {
    setThemeState();
    setWalletState({ isConnected: false });
    render(<Header />);
    expect(screen.getByTestId('connect-button')).toBeInTheDocument();
  });

  it('renders WalletConnect (wallet info visible when connected)', () => {
    setThemeState();
    setWalletState({
      isConnected: true,
      account: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTU',
      balance: '50.0000000',
    });
    render(<Header />);
    expect(screen.getByTestId('wallet-connected')).toBeInTheDocument();
  });
});
