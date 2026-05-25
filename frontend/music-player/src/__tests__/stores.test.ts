import { describe, it, expect, beforeEach } from 'vitest';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import { useThemeStore } from '../store/themeStore';
import { Track } from '../types/track';

const mockTrack: Track = {
  id: '1',
  title: 'Test Track',
  artist: 'Test Artist',
  artistAddress: 'GTEST123',
  duration: 180,
  ipfs_hash: 'QmTest',
  genre: 'Electronic',
  releaseDate: 1700000000,
  totalStreams: 0,
  royaltyRate: 0.1,
};

describe('MusicPlayerStore', () => {
  beforeEach(() => {
    useMusicPlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      volume: 80,
      progress: 0,
      duration: 0,
      repeat: 'off',
      shuffle: false,
      queue: [],
    });
  });

  it('should have correct initial state', () => {
    const state = useMusicPlayerStore.getState();
    expect(state.currentTrack).toBeNull();
    expect(state.isPlaying).toBe(false);
    expect(state.volume).toBe(80);
    expect(state.repeat).toBe('off');
    expect(state.shuffle).toBe(false);
  });

  it('should set current track and reset progress', () => {
    useMusicPlayerStore.getState().setCurrentTrack(mockTrack);
    expect(useMusicPlayerStore.getState().currentTrack).toEqual(mockTrack);
    expect(useMusicPlayerStore.getState().progress).toBe(0);
  });

  it('should toggle playing state', () => {
    useMusicPlayerStore.getState().setIsPlaying(true);
    expect(useMusicPlayerStore.getState().isPlaying).toBe(true);
    useMusicPlayerStore.getState().setIsPlaying(false);
    expect(useMusicPlayerStore.getState().isPlaying).toBe(false);
  });

  it('should set volume', () => {
    useMusicPlayerStore.getState().setVolume(50);
    expect(useMusicPlayerStore.getState().volume).toBe(50);
  });

  it('should play next track in queue', () => {
    const track2: Track = { ...mockTrack, id: '2', title: 'Track 2' };
    useMusicPlayerStore.setState({ queue: [mockTrack, track2], currentTrack: mockTrack });
    useMusicPlayerStore.getState().playNext();
    expect(useMusicPlayerStore.getState().currentTrack?.id).toBe('2');
    expect(useMusicPlayerStore.getState().isPlaying).toBe(true);
  });

  it('should play previous track in queue', () => {
    const track2: Track = { ...mockTrack, id: '2', title: 'Track 2' };
    useMusicPlayerStore.setState({ queue: [mockTrack, track2], currentTrack: track2 });
    useMusicPlayerStore.getState().playPrevious();
    expect(useMusicPlayerStore.getState().currentTrack?.id).toBe('1');
  });
});

describe('ThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ isDarkMode: false });
  });

  it('should default to light mode', () => {
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });

  it('should toggle dark mode', () => {
    useThemeStore.getState().toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(true);
    useThemeStore.getState().toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });
});
