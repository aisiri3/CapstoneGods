// src/utils/audioManager.js

class AudioManager {
    constructor() {
      this.backgroundMusic = null;
      this.activeAudios = new Set();
      this.normalVolume = 0.7; // Default volume for background music
      this.loweredVolume = 0.2; // Volume when other audio is playing
      this.isBackgroundMusicOn = false;
      this.volumeRestoreTimeout = null; // For delayed volume restoration
      this.fadeInterval = null; // For gradual volume increase
    }
  
    static getInstance() {
      if (!AudioManager.instance) {
        AudioManager.instance = new AudioManager();
      }
      return AudioManager.instance;
    }
  
    setBackgroundMusic(audioElement) {
      this.backgroundMusic = audioElement;
      this.backgroundMusic.volume = this.normalVolume;
      this.backgroundMusic.loop = true;
    }
  
    toggleBackgroundMusic(isOn) {
      this.isBackgroundMusicOn = isOn;
      
      if (!this.backgroundMusic) return;
      
      // Clear any volume transition timers
      this.clearVolumeTimers();
      
      if (isOn) {
        // Set appropriate volume based on whether other audio is playing
        this.backgroundMusic.volume = this.activeAudios.size > 0 ? this.loweredVolume : this.normalVolume;
        this.backgroundMusic.play().catch(e => console.error("Error playing background music:", e));
      } else {
        this.backgroundMusic.pause();
      }
      
      return isOn;
    }
  
    registerAudio(audioElement) {
      // Add event listeners to the audio element
      audioElement.addEventListener('play', () => this.handleAudioPlay(audioElement));
      audioElement.addEventListener('pause', () => this.handleAudioPause(audioElement));
      audioElement.addEventListener('ended', () => this.handleAudioPause(audioElement));
      
      // If audio is already playing when registered, add it to active audios
      if (!audioElement.paused) {
        this.handleAudioPlay(audioElement);
      }
      
      return audioElement;
    }
    
    handleAudioPlay(audioElement) {
      if (audioElement === this.backgroundMusic) return;
      
      this.activeAudios.add(audioElement);
      this.adjustBackgroundMusicVolume();
    }
    
    handleAudioPause(audioElement) {
      if (audioElement === this.backgroundMusic) return;
      
      this.activeAudios.delete(audioElement);
      this.adjustBackgroundMusicVolume();
    }
    
    adjustBackgroundMusicVolume() {
      if (!this.backgroundMusic || !this.isBackgroundMusicOn) return;
      
      // Clear any existing timeout and interval
      this.clearVolumeTimers();
      
      if (this.activeAudios.size > 0) {
        // Immediately lower volume when other audio starts playing
        this.backgroundMusic.volume = this.loweredVolume;
      } else {
        // Wait 1 second before starting to restore normal volume after other audio ends
        this.volumeRestoreTimeout = setTimeout(() => {
          this.fadeInVolume();
        }, 1000);
      }
    }
    
    fadeInVolume() {
      if (!this.backgroundMusic || !this.isBackgroundMusicOn || this.activeAudios.size > 0) return;
      
      // Clear any existing fade interval
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
      }
      
      // Start from current volume
      let currentVolume = this.backgroundMusic.volume;
      const targetVolume = this.normalVolume;
      const step = 0.02; // Small increment for smooth transition
      const interval = 30; // Update every 30ms (about 30fps)
      
      // Total time will be approximately 1 second (0.5/0.02 * 30ms ≈ 750ms)
      this.fadeInterval = setInterval(() => {
        // Increase volume by step
        currentVolume = Math.min(targetVolume, currentVolume + step);
        
        // Update audio volume
        if (this.backgroundMusic) {
          this.backgroundMusic.volume = currentVolume;
        }
        
        // If we've reached target volume or music is turned off, clear the interval
        if (currentVolume >= targetVolume || !this.isBackgroundMusicOn) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      }, interval);
    }
    
    clearVolumeTimers() {
      // Clear timeout for volume restore
      if (this.volumeRestoreTimeout) {
        clearTimeout(this.volumeRestoreTimeout);
        this.volumeRestoreTimeout = null;
      }
      
      // Clear interval for fade effect
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }
    
    // For components that create their own Audio elements
    monkeyPatchAudioConstructor() {
      const originalAudio = window.Audio;
      const audioManager = this;
      
      window.Audio = function(...args) {
        const audioElement = new originalAudio(...args);
        return audioManager.registerAudio(audioElement);
      };
    }
  }
  
  export default AudioManager.getInstance();