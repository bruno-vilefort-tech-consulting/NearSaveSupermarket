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
    // Create a pleasant notification sound sequence
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect oscillators to gain node to speakers
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set frequencies for a pleasant chord (C and E notes)
    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
    
    // Set waveform type
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    // Create volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    // Start and stop oscillators
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.6);
    oscillator2.stop(audioContext.currentTime + 0.6);
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