import { useCallback } from 'react';

export function useSound() {
  const playSound = useCallback((soundFile: string) => {
    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.volume = 0.5;
      audio.play().catch((error) => {
        console.warn('Failed to play sound:', error);
      });
    } catch (error) {
      console.warn('Sound playback error:', error);
    }
  }, []);

  const playHit = useCallback(() => playSound('hit.mp3'), [playSound]);
  const playMiss = useCallback(() => playSound('miss.mp3'), [playSound]);
  const playCorrect = useCallback(() => playSound('correct.mp3'), [playSound]);
  const playWrong = useCallback(() => playSound('wrong.mp3'), [playSound]);

  return {
    playHit,
    playMiss,
    playCorrect,
    playWrong,
  };
}
