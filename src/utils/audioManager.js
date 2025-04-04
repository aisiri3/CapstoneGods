// src/utils/audioManager.js

class AudioManager {
  constructor() {
    this.backgroundMusic = null;
    this.activeAudios = new Set();
    this.normalVolume = 0.8; // Default volume for background music
    this.loweredVolume = 0.5; // Volume when other audio is playing
    this.isBackgroundMusicOn = false;
    this.volumeRestoreTimeout = null; // For delayed volume restoration
    this.fadeInterval = null; // For gradual volume increase
    this.audioContext = null; // Keep track of AudioContext for memory management
    this.musicPosition = 0; // Store current position when paused
    this.musicPositionUpdateInterval = null; // Interval to track music position
    this.volumeMultiplier = 1.0; // To handle slider values > 1.0
    
    // Volume normalization factors for different tracks
    this.volumeNormalization = {
      "/backgrounds/cafe-music.mp3": 1.0,    // Base track (no adjustment)
      "/backgrounds/office-music.mp3": 0.5    // Adjust this value to balance with cafe music
    };
    
    // Current music source path
    this.currentMusicPath = "";
    
    // Track recently played speech files to prevent echo
    this.recentlySpeechPlayed = new Map();
    this.speechDebounceDuration = 300; // ms to prevent duplicate speech plays
    
    // Track speech audio elements by source
    this.speechAudios = new Map();
  }

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  setBackgroundMusic(audioElement) {
    // If there's an existing backgroundMusic element, clean it up
    if (this.backgroundMusic) {
      try {
        // Store current position before switching tracks
        this.musicPosition = this.backgroundMusic.currentTime;
        
        // Clean up the element
        this.backgroundMusic.pause();
        this.backgroundMusic.src = "";
        this.backgroundMusic.load(); // Force release of resources
        this.backgroundMusic = null;
        
        // If switching tracks, reset position
        if (audioElement.src !== this.currentMusicPath) {
          this.musicPosition = 0;
        }
      } catch (error) {
        console.error("Error cleaning up previous audio:", error);
      }
    }
    
    this.backgroundMusic = audioElement;
    
    // Store the source for normalization purposes
    this.currentMusicPath = audioElement.src;
    
    // Set loop property
    this.backgroundMusic.loop = true;
    
    // Apply volume normalization
    this.applyVolumeNormalization();
  }
  
  // Set volume with multiplier for values > 1.0
  setVolume(baseVolume) {
    // Store the raw volume value (can be > 1.0)
    this.normalVolume = baseVolume;
    
    // Apply the volume through normalization
    this.applyVolumeNormalization();
  }
  
  applyVolumeNormalization() {
    if (!this.backgroundMusic) return;
    
    // Extract the path from the full URL
    let path = this.currentMusicPath;
    if (path.includes("://")) {
      const urlObj = new URL(path);
      path = urlObj.pathname;
    }
    
    // Find matching path in the normalization map
    let normalizationFactor = 1.0;
    
    for (const [trackPath, factor] of Object.entries(this.volumeNormalization)) {
      if (path.endsWith(trackPath)) {
        normalizationFactor = factor;
        break;
      }
    }
    
    // Calculate the normalized volumes, ensuring they stay within valid range (0-1)
    const normalizedBaseVolume = Math.min(this.normalVolume * normalizationFactor, 1.0);
    const normalizedLowVolume = Math.min(this.loweredVolume * normalizationFactor, 1.0);
    
    // Apply the appropriate volume based on whether other audio is playing
    try {
      if (this.activeAudios.size > 0) {
        this.backgroundMusic.volume = normalizedLowVolume;
      } else {
        this.backgroundMusic.volume = normalizedBaseVolume;
      }
    } catch (error) {
      console.error("Error setting audio volume:", error);
    }
  }

  toggleBackgroundMusic(isOn) {
    // Update state first
    this.isBackgroundMusicOn = isOn;
    
    if (!this.backgroundMusic) return isOn;
    
    // Clear any volume transition timers
    this.clearVolumeTimers();
    
    // Clear the position tracking interval
    this._clearPositionTrackingInterval();
    
    try {
      if (isOn) {
        // Set the position to continue from where we left off
        if (this.musicPosition > 0) {
          this.backgroundMusic.currentTime = this.musicPosition;
        }
        
        // Apply volume normalization
        this.applyVolumeNormalization();
        
        // Start tracking the current position
        this._startPositionTrackingInterval();
        
        // Ensure the audio can be played
        const playPromise = this.backgroundMusic.play();
        
        // Handle potential promise rejection (browser requires user interaction)
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing background music:", error);
            // Reset state if failed to play
            this.isBackgroundMusicOn = false;
            this._clearPositionTrackingInterval();
          });
        }
      } else {
        // Save current position before pausing
        this.musicPosition = this.backgroundMusic.currentTime;
        
        // Ensure audio is properly stopped without resetting position
        this.backgroundMusic.pause();
      }
    } catch (error) {
      console.error("Error toggling background music:", error);
      // Reset state on error
      this.isBackgroundMusicOn = false;
      this._clearPositionTrackingInterval();
    }
    
    return isOn;
  }

  // Start an interval to periodically update the stored music position
  _startPositionTrackingInterval() {
    this._clearPositionTrackingInterval();
    
    // Update position every 5 seconds
    this.musicPositionUpdateInterval = setInterval(() => {
      if (this.backgroundMusic && !this.backgroundMusic.paused) {
        this.musicPosition = this.backgroundMusic.currentTime;
      }
    }, 5000);
  }
  
  // Clear the position tracking interval
  _clearPositionTrackingInterval() {
    if (this.musicPositionUpdateInterval) {
      clearInterval(this.musicPositionUpdateInterval);
      this.musicPositionUpdateInterval = null;
    }
  }

  registerAudio(audioElement) {
    // Add event listeners to the audio element
    const playHandler = () => this.handleAudioPlay(audioElement);
    const pauseHandler = () => this.handleAudioPause(audioElement);
    const endedHandler = () => this.handleAudioPause(audioElement);
    
    audioElement.addEventListener('play', playHandler);
    audioElement.addEventListener('pause', pauseHandler);
    audioElement.addEventListener('ended', endedHandler);
    
    // Store references to the event handlers for potential cleanup
    audioElement._audioManagerHandlers = {
      play: playHandler,
      pause: pauseHandler,
      ended: endedHandler
    };
    
    // If audio is already playing when registered, add it to active audios
    if (!audioElement.paused) {
      this.handleAudioPlay(audioElement);
    }
    
    return audioElement;
  }
  
  // New method to play speech audio with duplicate prevention
  playSpeech(src) {
    // Ignore falsy or empty src
    if (!src) return null;
    
    // Check if this source was played recently (to prevent echoes)
    const now = Date.now();
    if (this.recentlySpeechPlayed.has(src)) {
      const lastPlayedTime = this.recentlySpeechPlayed.get(src);
      if (now - lastPlayedTime < this.speechDebounceDuration) {
        console.log(`Preventing duplicate play of ${src}`);
        return null; // Skip playing to prevent echo
      }
    }
    
    // Update last played time
    this.recentlySpeechPlayed.set(src, now);
    
    // Clean up old entries from recently played map (prevent memory leaks)
    if (this.recentlySpeechPlayed.size > 50) {
      const oldEntries = [...this.recentlySpeechPlayed.entries()]
        .sort((a, b) => a[1] - b[1])
        .slice(0, 20);
        
      for (const [key] of oldEntries) {
        this.recentlySpeechPlayed.delete(key);
      }
    }
    
    // Check if we already have an audio element for this source
    let audio;
    if (this.speechAudios.has(src)) {
      audio = this.speechAudios.get(src);
      
      // Reset the audio to make sure it plays from the beginning
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {
        console.error("Error resetting speech audio:", e);
        // If there was an error, create a new audio element
        audio = new Audio(src);
        this.speechAudios.set(src, audio);
      }
    } else {
      // Create a new audio element
      audio = new Audio(src);
      this.speechAudios.set(src, audio);
    }
    
    // Play the audio
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing speech audio:", error);
          // Remove from recently played on error
          this.recentlySpeechPlayed.delete(src);
        });
      }
    } catch (error) {
      console.error("Error playing speech audio:", error);
      this.recentlySpeechPlayed.delete(src);
    }
    
    return audio;
  }
  
  // Helper method to get the base part of a URL/path
  getBasePath(url) {
    if (!url) return '';
    
    // Extract just the filename
    let filename = url;
    
    // Handle URLs
    if (url.includes('://')) {
      try {
        const urlObj = new URL(url);
        filename = urlObj.pathname;
      } catch (e) {
        console.error("Error parsing URL:", e);
      }
    }
    
    // Handle paths
    if (filename.includes('/')) {
      filename = filename.split('/').pop();
    }
    
    return filename;
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
    
    // Extract the path for normalization
    let path = this.currentMusicPath;
    if (path.includes("://")) {
      const urlObj = new URL(path);
      path = urlObj.pathname;
    }
    
    // Find the normalization factor
    let normalizationFactor = 1.0;
    for (const [trackPath, factor] of Object.entries(this.volumeNormalization)) {
      if (path.endsWith(trackPath)) {
        normalizationFactor = factor;
        break;
      }
    }
    
    if (this.activeAudios.size > 0) {
      // Immediately lower volume when other audio starts playing
      try {
        // Ensure we stay within 0-1 range
        const safeVolume = Math.min(this.loweredVolume * normalizationFactor, 1.0);
        this.backgroundMusic.volume = safeVolume;
      } catch (error) {
        console.error("Error adjusting background music volume:", error);
      }
    } else {
      // Wait 1 second before starting to restore normal volume after other audio ends
      this.volumeRestoreTimeout = setTimeout(() => {
        this.fadeInVolume(normalizationFactor);
      }, 1000);
    }
  }
  
  fadeInVolume(normalizationFactor = 1.0) {
    if (!this.backgroundMusic || !this.isBackgroundMusicOn || this.activeAudios.size > 0) return;
    
    // Clear any existing fade interval
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }
    
    try {
      // Start from current volume
      let currentVolume = this.backgroundMusic.volume;
      const targetVolume = Math.min(this.normalVolume * normalizationFactor, 1.0); // Ensure we stay within 0-1 range
      const step = 0.02; // Small increment for smooth transition
      const interval = 30; // Update every 30ms (about 30fps)
      
      // Total time will be approximately 1 second (0.5/0.02 * 30ms ≈ 750ms)
      this.fadeInterval = setInterval(() => {
        if (!this.backgroundMusic || !this.isBackgroundMusicOn) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          return;
        }
        
        // Increase volume by step
        currentVolume = Math.min(targetVolume, currentVolume + step);
        
        // Update audio volume
        try {
          this.backgroundMusic.volume = currentVolume;
        } catch (error) {
          console.error("Error during fade in:", error);
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          return;
        }
        
        // If we've reached target volume or music is turned off, clear the interval
        if (currentVolume >= targetVolume || !this.isBackgroundMusicOn) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      }, interval);
    } catch (error) {
      console.error("Error setting up fade in:", error);
    }
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
  
  // Override Audio constructor to add duplicate prevention for speech
  monkeyPatchAudioConstructor() {
    try {
      const originalAudio = window.Audio;
      const audioManager = this;
      
      window.Audio = function(...args) {
        const src = args[0];
        
        // Check if this is likely a speech audio by filename pattern
        // Adjust this regex to match your speech audio file naming conventions
        const isSpeechAudio = typeof src === 'string' && 
          (/speech|voice|avatar|dialogue|dialog|talk|say/i.test(src) || 
           /\.mp3$|\.wav$|\.ogg$/i.test(src));
        
        if (isSpeechAudio && typeof src === 'string') {
          // Check for recent duplicate
          const now = Date.now();
          const basePath = audioManager.getBasePath(src);
          
          if (audioManager.recentlySpeechPlayed.has(basePath)) {
            const lastPlayedTime = audioManager.recentlySpeechPlayed.get(basePath);
            if (now - lastPlayedTime < audioManager.speechDebounceDuration) {
              console.log(`Preventing duplicate creation of ${basePath}`);
              
              // Return existing audio element or create a non-autoplaying one
              if (audioManager.speechAudios.has(basePath)) {
                return audioManager.speechAudios.get(basePath);
              }
            }
          }
          
          // Update last played time
          audioManager.recentlySpeechPlayed.set(basePath, now);
        }
        
        // Create the audio element normally
        const audioElement = new originalAudio(...args);
        return audioManager.registerAudio(audioElement);
      };
    } catch (error) {
      console.error("Error monkey patching Audio constructor:", error);
    }
  }
  
  // Utility method to adjust a normalization factor
  setNormalizationFactor(musicPath, factor) {
    this.volumeNormalization[musicPath] = factor;
    
    // If this is the current track, apply the new normalization
    if (this.backgroundMusic && this.currentMusicPath.includes(musicPath)) {
      this.applyVolumeNormalization();
    }
  }
  
  // Set the debounce duration for speech audio
  setSpeechDebounceDuration(ms) {
    if (typeof ms === 'number' && ms >= 0) {
      this.speechDebounceDuration = ms;
    }
  }
  
  // Method to clean up resources properly
  cleanup() {
    this.clearVolumeTimers();
    this._clearPositionTrackingInterval();
    
    if (this.backgroundMusic) {
      try {
        // Store position before cleanup
        this.musicPosition = this.backgroundMusic.currentTime;
        
        this.backgroundMusic.pause();
        this.backgroundMusic.src = "";
        this.backgroundMusic.load(); // Force release of resources
        this.backgroundMusic = null;
      } catch (error) {
        console.error("Error cleaning up audio:", error);
      }
    }
    
    // Clean up any active audio elements
    for (const audio of this.activeAudios) {
      try {
        if (audio._audioManagerHandlers) {
          audio.removeEventListener('play', audio._audioManagerHandlers.play);
          audio.removeEventListener('pause', audio._audioManagerHandlers.pause);
          audio.removeEventListener('ended', audio._audioManagerHandlers.ended);
        }
      } catch (error) {
        console.error("Error removing event listeners:", error);
      }
    }
    
    // Clean up speech audios
    for (const [src, audio] of this.speechAudios) {
      try {
        audio.pause();
        audio.src = "";
      } catch (error) {
        console.error("Error cleaning up speech audio:", error);
      }
    }
    
    this.speechAudios.clear();
    this.recentlySpeechPlayed.clear();
    this.activeAudios.clear();
    this.isBackgroundMusicOn = false;
  }
  
  // Method to reset music position (useful if you want to start from beginning)
  resetMusicPosition() {
    this.musicPosition = 0;
    
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.currentTime = 0;
      } catch (error) {
        console.error("Error resetting music position:", error);
      }
    }
  }
}

export default AudioManager.getInstance();