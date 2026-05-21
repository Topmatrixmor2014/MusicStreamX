import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Heart, 
  Share2, 
  MoreHorizontal,
  Repeat,
  Shuffle
} from 'lucide-react';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import { useWalletStore } from '../store/walletStore';
import { useStreamCount } from '../utils/useStreamCount';

export const MusicPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    repeat,
    shuffle,
    setIsPlaying,
    setVolume,
    setProgress,
    setRepeat,
    setShuffle,
    playNext,
    playPrevious
  } = useMusicPlayerStore();

  const { isConnected } = useWalletStore();
  const { streamCount } = useStreamCount(currentTrack?.id);
  const [showVolume, setShowVolume] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    playNext();
  };

  const handlePrevious = () => {
    playPrevious();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = (newProgress / 100) * duration;
    }
  };

  const handleLike = async () => {
    if (!isConnected || !currentTrack) return;
    
    try {
      // Like track on blockchain
      setIsLiked(!isLiked);
      // TODO: Implement blockchain like functionality
    } catch (error) {
      console.error('Failed to like track:', error);
    }
  };

  const handleShare = () => {
    if (!currentTrack) return;
    
    const shareUrl = `${window.location.origin}/track/${currentTrack.id}`;
    navigator.clipboard.writeText(shareUrl);
    // TODO: Show toast notification
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>No track selected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.ipfs_hash}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setProgress((audio.currentTime / audio.duration) * 100);
        }}
        onLoadedMetadata={() => {
          // TODO: Update duration
        }}
        onEnded={() => {
          if (repeat === 'one') {
            audioRef.current!.currentTime = 0;
            audioRef.current!.play();
          } else {
            playNext();
          }
        }}
      />
      
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Track Info */}
            <div className="flex items-center space-x-4 flex-1">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center"
              >
                <span className="text-white font-bold text-sm">
                  {currentTrack.title.charAt(0).toUpperCase()}
                </span>
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {currentTrack.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {currentTrack.artist}
                </p>
                {streamCount !== null && (
                  <p className="text-xs text-purple-500 dark:text-purple-400">
                    {streamCount.toLocaleString()} streams
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={`p-2 rounded-full transition-colors ${
                    isLiked 
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
              {/* Main Controls */}
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShuffle(!shuffle)}
                  className={`p-2 rounded-full transition-colors ${
                    shuffle 
                      ? 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevious}
                  className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePlayPause}
                  className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNext}
                  className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                  className={`p-2 rounded-full transition-colors ${
                    repeat !== 'off' 
                      ? 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center space-x-2 w-full">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime((progress / 100) * duration)}
                </span>
                
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleProgressChange}
                    className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 ${progress}%, #e5e7eb ${progress}%)`
                    }}
                  />
                </div>
                
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 flex-1 justify-end">
              <AnimatePresence>
                {showVolume && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 100 }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #8b5cf6 ${volume}%, #e5e7eb ${volume}%)`
                      }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
                      {volume}%
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowVolume(!showVolume)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};
