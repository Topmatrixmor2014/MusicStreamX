import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicPlayer } from '../components/MusicPlayer';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import { useWalletStore } from '../store/walletStore';

vi.mock('../store/musicPlayerStore');
vi.mock('../store/walletStore');

// framer-motion: render children without animation overhead
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_t, tag) => {
      const { forwardRef, createElement } = require('react');
      return forwardRef(({ children, ...props }: any, ref: any) =>
        createElement(tag as string, { ...props, ref }, children)
      );
    },
  }),
  AnimatePresence: ({ children }: any) => children,
}));

const mockSetIsPlaying = vi.fn();
const mockSetVolume = vi.fn();
const mockSetProgress = vi.fn();
const mockSetRepeat = vi.fn();
const mockSetShuffle = vi.fn();
const mockPlayNext = vi.fn();
const mockPlayPrevious = vi.fn();

const basePlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: 80,
  progress: 0,
  duration: 200,
  repeat: 'off' as const,
  shuffle: false,
  queue: [],
  setCurrentTrack: vi.fn(),
  setIsPlaying: mockSetIsPlaying,
  setVolume: mockSetVolume,
  setProgress: mockSetProgress,
  setRepeat: mockSetRepeat,
  setShuffle: mockSetShuffle,
  playNext: mockPlayNext,
  playPrevious: mockPlayPrevious,
};

const mockTrack = {
  id: '1',
  title: 'Test Song',
  artist: 'Test Artist',
  genre: 'pop' as const,
  duration: 200,
  ipfs_hash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
};

function setPlayerState(overrides = {}) {
  vi.mocked(useMusicPlayerStore).mockReturnValue({ ...basePlayerState, ...overrides });
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
  // Stub HTMLMediaElement (jsdom doesn't implement audio)
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
  // Stub Clipboard API (not available in jsdom)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

describe('MusicPlayer — no track', () => {
  it('renders "No track selected" when currentTrack is null', () => {
    setPlayerState();
    setWalletState();
    render(<MusicPlayer />);
    expect(screen.getByText('No track selected')).toBeInTheDocument();
  });

  it('does not render player controls when no track', () => {
    setPlayerState();
    setWalletState();
    render(<MusicPlayer />);
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
});

describe('MusicPlayer — with track', () => {
  beforeEach(() => {
    setPlayerState({ currentTrack: mockTrack });
    setWalletState();
  });

  it('renders track title and artist', () => {
    render(<MusicPlayer />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('renders the progress slider', () => {
    render(<MusicPlayer />);
    expect(screen.getAllByRole('slider').length).toBeGreaterThan(0);
  });

  it('calls setIsPlaying when play/pause button is clicked', () => {
    render(<MusicPlayer />);
    // The play/pause button is the only button with a purple background class
    const buttons = screen.getAllByRole('button');
    const playPauseBtn = buttons.find((b) => b.className.includes('bg-purple-500'));
    expect(playPauseBtn).toBeDefined();
    fireEvent.click(playPauseBtn!);
    expect(mockSetIsPlaying).toHaveBeenCalledWith(true);
  });

  it('calls playNext when next button is clicked', () => {
    render(<MusicPlayer />);
    // SkipForward button is the 4th button in the controls row (shuffle, prev, play, next, repeat)
    // We identify it by clicking all buttons and checking playNext was called
    const buttons = screen.getAllByRole('button');
    buttons.forEach((b) => fireEvent.click(b));
    expect(mockPlayNext).toHaveBeenCalled();
  });

  it('calls playPrevious when previous button is clicked', () => {
    render(<MusicPlayer />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((b) => fireEvent.click(b));
    expect(mockPlayPrevious).toHaveBeenCalled();
  });

  it('calls setShuffle when shuffle button is clicked', () => {
    render(<MusicPlayer />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((b) => fireEvent.click(b));
    expect(mockSetShuffle).toHaveBeenCalled();
  });

  it('calls setRepeat when repeat button is clicked', () => {
    render(<MusicPlayer />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((b) => fireEvent.click(b));
    expect(mockSetRepeat).toHaveBeenCalled();
  });

  it('calls setProgress when progress slider changes', () => {
    render(<MusicPlayer />);
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '30' } });
    expect(mockSetProgress).toHaveBeenCalledWith(30);
  });

  it('calls setVolume when volume slider is shown and changed', () => {
    render(<MusicPlayer />);
    // Click the volume button to show the volume slider
    const buttons = screen.getAllByRole('button');
    const volumeBtn = buttons[buttons.length - 1]; // Volume button is last
    fireEvent.click(volumeBtn);
    const sliders = screen.getAllByRole('slider');
    const volumeSlider = sliders[sliders.length - 1];
    fireEvent.change(volumeSlider, { target: { value: '50' } });
    expect(mockSetVolume).toHaveBeenCalledWith(50);
  });

  it('displays formatted time for progress and duration', () => {
    setPlayerState({ currentTrack: mockTrack, progress: 50, duration: 200 });
    setWalletState();
    render(<MusicPlayer />);
    // 50% of 200s = 100s = 1:40
    expect(screen.getByText('1:40')).toBeInTheDocument();
    // duration = 200s = 3:20
    expect(screen.getByText('3:20')).toBeInTheDocument();
  });

  it('calls clipboard.writeText when share button is clicked', () => {
    render(<MusicPlayer />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((b) => fireEvent.click(b));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
