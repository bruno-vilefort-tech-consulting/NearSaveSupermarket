import { useRef, useCallback, useEffect, useState } from 'react';

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize Web Audio API
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      setIsReady(true);
    } catch (error) {
      console.error('Web Audio API not supported:', error);
      setIsReady(false);
    }
  }, []);

  const enableSound = useCallback(async () => {
    if (!audioContextRef.current || !isReady) return false;

    try {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      setIsEnabled(true);
      return true;
    } catch (error) {
      console.error('Failed to enable notification sound:', error);
      return false;
    }
  }, [isReady]);

  const createNotificationSound = useCallback((audioContext: AudioContext) => {
    // Create a bell-like notification sound
    const playBellNote = (frequency: number, startTime: number, duration: number, volume: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Use sine wave for bell-like tone
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      
      // Create bell-like envelope (quick attack, slow decay)
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Play bell sequence (ding-dong pattern)
    const now = audioContext.currentTime;
    playBellNote(880, now, 0.8, 0.4);        // A5 - first ding
    playBellNote(659.25, now + 0.3, 1.0, 0.3); // E5 - second dong
  }, []);

  const playNotification = useCallback(async () => {
    if (!audioContextRef.current || !isEnabled || !isReady) return false;

    try {
      // Resume audio context if needed
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      createNotificationSound(audioContextRef.current);
      return true;
    } catch (error) {
      console.error('Failed to play notification sound:', error);
      return false;
    }
  }, [isEnabled, isReady, createNotificationSound]);

  return {
    isEnabled,
    isReady,
    enableSound,
    playNotification
  };
}