"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import "@/styles/SideBar.css";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/Tooltip";
// icons
import { AlignLeft, AlignRight, ChevronDown, Settings, UserPen, Check } from "lucide-react";
import { TbMusic, TbMusicOff } from "react-icons/tb";

import audioManager from "@/utils/audioManager";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [user, setUser] = useState(null); // Store user data
  const [isSending, setIsSending] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [activeMusicPersona, setActiveMusicPersona] = useState("Casual");
  const [musicVolume, setMusicVolume] = useState(0.8); // Default to match audioManager.normalVolume
  const audioRef = useRef(null);
  const audioInitialized = useRef(false);
  const currentMusicFile = useRef("/backgrounds/cafe-music.mp3");
  const maxVolume = 1.5; // Maximum volume multiplier
  
  // Default selections
  const defaultSelections = {
    gender: "Male", 
    persona: "Casual", 
    language: "English"
  };
  
  // Current selections
  const [selections, setSelections] = useState({...defaultSelections});
  
  // Last saved selections
  const [lastSavedSelections, setLastSavedSelections] = useState({...defaultSelections});

  // Helper function to get the appropriate music file based on persona
  const getMusicFileForPersona = (persona) => {
    switch(persona) {
      case "Professional":
        return "/backgrounds/office-music.mp3";
      case "Casual":
      default:
        return "/backgrounds/cafe-music.mp3";
    }
  };

  // Function to handle volume change
  const handleVolumeChange = (e) => {
    // Get the raw slider value (0 to 1.5 range)
    const sliderValue = parseFloat(e.target.value);
    setMusicVolume(sliderValue);
    
    // Store user's volume preference (the slider value)
    localStorage.setItem("musicVolume", sliderValue.toString());
    
    // Ensure the actual audio volume stays within valid HTML Audio range (0-1)
    // This allows the slider to go beyond 1 for user perception of "extra loud"
    // but prevents actual volume from exceeding browser limits
    const actualVolume = Math.min(sliderValue, 1.0);
    
    // Update the audio manager's normal volume
    audioManager.normalVolume = actualVolume;
    
    // Apply normalization
    audioManager.applyVolumeNormalization();
  };

  // Function to update background music based on persona
  const updateBackgroundMusic = (newPersona) => {
    const newMusicFile = getMusicFileForPersona(newPersona);
    
    // If music file is the same, no need to change
    if (newMusicFile === currentMusicFile.current) {
      // Just update the active persona without changing the music
      setActiveMusicPersona(newPersona);
      return;
    }
    
    // Update the current music file
    currentMusicFile.current = newMusicFile;
    
    // Update the active music persona
    setActiveMusicPersona(newPersona);
    
    // If music is currently playing, we need to change the track
    if (isMusicOn) {
      try {
        // First stop current music (ensure it's fully stopped)
        audioManager.toggleBackgroundMusic(false);
        
        // Small delay to ensure audio has time to properly stop and clean up
        const switchDelay = setTimeout(() => {
          try {
            // Clear old audio reference completely
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.src = "";
              audioRef.current = null;
            }
            
            // Create a new audio element with the new music
            audioRef.current = new Audio(newMusicFile);
            audioManager.setBackgroundMusic(audioRef.current);
            
            // Start playing the new music
            audioManager.toggleBackgroundMusic(true);
          } catch (innerError) {
            console.error("Error creating new audio after delay:", innerError);
          }
          
          // Clear the timeout reference
          clearTimeout(switchDelay);
        }, 150); // Increase delay to ensure complete cleanup
      } catch (error) {
        console.error("Error switching music tracks:", error);
      }
    } else {
      // Just update the audio source without playing
      try {
        // Properly clean up existing audio element
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        
        // Create new audio element
        audioRef.current = new Audio(newMusicFile);
        audioManager.setBackgroundMusic(audioRef.current);
      } catch (error) {
        console.error("Error updating audio source:", error);
      }
    }
  }

  // fetch user info for display (from localStorage)
  useEffect(() => {
    // Retrieve user info from localStorage
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
    
    // Check if there are stored selections in localStorage
    const storedSelections = JSON.parse(localStorage.getItem("userSelections"));
    if (storedSelections) {
      setSelections(storedSelections);
      setLastSavedSelections(storedSelections);
      
      // Set the active music persona based on stored selections
      setActiveMusicPersona(storedSelections.persona);
      
      // Set the music file based on stored persona
      currentMusicFile.current = getMusicFileForPersona(storedSelections.persona);
    } else {
      // If no stored selections, save the defaults
      localStorage.setItem("userSelections", JSON.stringify(defaultSelections));
    }

    // Check if music preference is stored in localStorage
    const musicPreference = localStorage.getItem("musicOn") === "true";
    setIsMusicOn(musicPreference);
    
    // Check if volume preference is stored in localStorage
    const storedVolume = localStorage.getItem("musicVolume");
    if (storedVolume) {
      const parsedVolume = parseFloat(storedVolume);
      if (!isNaN(parsedVolume)) {
        setMusicVolume(parsedVolume);
        audioManager.normalVolume = parsedVolume;
      }
    }

    // Initialize audio through the audio manager (only once)
    if (!audioInitialized.current) {
      try {
        audioRef.current = new Audio(currentMusicFile.current);
        audioManager.setBackgroundMusic(audioRef.current);
        audioInitialized.current = true;
        
        // Apply saved music preference
        if (musicPreference) {
          audioManager.toggleBackgroundMusic(true);
        }
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    }

    // Patch Audio constructor to ensure all new audio instances are registered
    try {
      audioManager.monkeyPatchAudioConstructor();
    } catch (error) {
      console.error("Error patching Audio constructor:", error);
    }

    // Set up event listener for avatar selection changes
    const handleAvatarSelectionChange = (event) => {
      if (event.detail && event.detail.persona) {
        updateBackgroundMusic(event.detail.persona);
      }
    };
    
    window.addEventListener('avatarSelectionChanged', handleAvatarSelectionChange);

    // Cleanup on component unmount
    return () => {
      try {
        if (isMusicOn) {
          audioManager.toggleBackgroundMusic(false);
        }
        
        window.removeEventListener('avatarSelectionChanged', handleAvatarSelectionChange);
      } catch (error) {
        console.error("Error cleaning up audio:", error);
      }
    };
  }, []);

  const toggleSidebar = () => {
    if (isExpanded) {
      setOpenSubmenus({});
    }
    setIsExpanded(!isExpanded);
  };

  // Function to handle submenu toggling
  const handleSubmenuToggle = (item) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => {
        setOpenSubmenus((prev) => ({
          ...prev,
          [item]: true,
        }));
      }, 350);
    } else {
      setOpenSubmenus((prev) => ({
        ...prev,
        [item]: !prev[item],
      }));
    }
  };
  
  // Function to handle selection of an option
  const handleSelection = (category, value) => {
    const newSelections = {
      ...selections,
      [category]: value
    };
    
    setSelections(newSelections);
  };
  
  // Function to check if selections have changed from last saved state
  const hasSelectionChanged = () => {
    return Object.keys(selections).some(key => 
      selections[key] !== lastSavedSelections[key]
    );
  };

  // Function to toggle music on/off
  const toggleMusic = () => {
    try {
      const newMusicState = !isMusicOn;
      setIsMusicOn(newMusicState);
      localStorage.setItem("musicOn", newMusicState.toString());
      
      if (!newMusicState && audioRef.current) {
        // Explicitly pause the audio element as a backup
        audioRef.current.pause();
      }
      
      // Use the audio manager to handle the toggle
      audioManager.toggleBackgroundMusic(newMusicState);
    } catch (error) {
      console.error("Error toggling music:", error);
    }
  };

  // Function to send selections to the backend
  const sendSelectionsToBackend = async (selections) => {
    try {
      setIsSending(true);
      const response = await fetch('/api/send-selections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selections),
      });

      if (!response.ok) {
        throw new Error(`Failed to send selections to backend: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      return true;
    } catch (error) {
      console.error('Error sending selections to backend:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  };
  
  // Function to handle complete selection
  const handleCompleteSelection = async () => {
    // Check if any changes were made
    if (!hasSelectionChanged()) {
      alert("You have not made any changes yet!");
      return;
    }
    
    // Save selections to localStorage
    localStorage.setItem("userSelections", JSON.stringify(selections));
    
    // Update last saved selections
    setLastSavedSelections({...selections});
    
    // Send selections to backend
    const success = await sendSelectionsToBackend(selections);
    
    // Check if persona changed and update music if needed
    if (lastSavedSelections.persona !== selections.persona) {
      try {
        updateBackgroundMusic(selections.persona);
      } catch (error) {
        console.error("Error updating background music:", error);
      }
    }
    
    // Dispatch a custom event to notify other components about the selection change
    const event = new CustomEvent('avatarSelectionChanged', { 
      detail: { ...selections }
    });
    window.dispatchEvent(event);
    
    // Close any open submenus
    setOpenSubmenus({});
    
    // Provide feedback
    if (success) {
      // alert("Your selection has been saved!");
      setIsExpanded(!isExpanded);
    } else {
      // Even if backend fails, the frontend will still update
      alert("Your selection has been saved locally, but there was an issue updating the backend.");
    }
  };

  // Submenus items
  const menuItems = [
    {
      id: "gender",
      label: "Select Gender",
      icon: "/icons/gender-icon.png",
      submenu: ["Male", "Female"],
    },
    {
      id: "persona",
      label: "Select Persona",
      icon: "/icons/personas-icon.png",
      submenu: ["Casual", "Professional"],
    },
    {
      id: "language",
      label: "Select Language",
      icon: "/icons/language-icon.png",
      submenu: ["English", "Malay"],
    },
  ];

  // Calculate default slider position (66% of max)
  const defaultSliderPosition = maxVolume * 0.66;

  return (
    <div className="sidebar-container">
      <div className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}>

        {/* Customize Avatar Header */}
        {isExpanded && (
          <div className="customize-avatar-header">
            <UserPen size={25} className="header-icon" />
            <span>Customize</span>
          </div>
        )}

        {/* Expand sidebar button */}
        <button type="button" className="expand-button" onClick={toggleSidebar}>
          {isExpanded ? <AlignLeft size={24} /> : <AlignRight size={24} />}
        </button>
        
        {/* All icons with submenus */}
        <div className="sidebar-items">
          {menuItems.map((item) => (
            <div key={item.id}>
              <TooltipProvider delayDuration={70}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`sidebar-icon ${openSubmenus[item.id] ? "active" : ""}`}
                      onClick={() => handleSubmenuToggle(item.id)}
                    >
                      <Image
                        src={item.icon}
                        alt={item.label}
                        width={35}
                        height={35}
                        className="sidebar-custom-icon"
                        priority
                      />
                      {/* Show heading & chevron when sidebar is expanded */}
                      {isExpanded && <span>{item.label}</span>}
                      {isExpanded && <ChevronDown size={20} className="chevron-icon" />}
                    </div>
                  {/* Tooltip when not expanded */}
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right" className="px-3 py-1.5 text-xs tooltip">
                      <span>{item.label}</span>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {isExpanded && openSubmenus[item.id] && item.submenu && (
                <div className="submenu">
                  {item.submenu.map((subItem) => (
                    <div 
                      key={subItem} 
                      className={`submenu-item ${selections[item.id] === subItem ? 'selected' : ''}`}
                      onClick={() => handleSelection(item.id, subItem)}
                    >
                      <div className="submenu-content">
                        <span>{subItem}</span>
                        {selections[item.id] === subItem && (
                          <Check size={16} className="check-icon" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Complete Selection Button - Always visible when expanded */}
          {isExpanded && (
            <button 
              className="complete-selection-button"
              onClick={handleCompleteSelection}
              disabled={isSending}
            >
              {isSending ? 'Saving...' : 'Complete Selection'}
            </button>
          )}
        </div>

        {/* Music Toggle */}
        <div className="music-toggle">
          <TooltipProvider delayDuration={70}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="sidebar-icon" onClick={toggleMusic}>
                  {isMusicOn ? 
                    <TbMusic size={32} style={{ color: "#b77beb" }} /> : 
                    <TbMusicOff size={32} style={{ color: "#8a7b97" }} />
                  }
                  {/* Volume slider when expanded */}
                  {isExpanded && isMusicOn ? (
                    <div className="volume-slider-container" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="range" 
                        min="0" 
                        max={maxVolume} 
                        step="0.01"
                        value={musicVolume}
                        onChange={handleVolumeChange}
                        className="volume-slider"
                      />
                      <span className="music-type">
                        {activeMusicPersona === "Professional" ? "Office" : "Cafe"}
                      </span>
                    </div>
                  ) : isExpanded ? (
                    <span>Music Off</span>
                  ) : null}
                </div>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right" className="px-3 py-1.5 text-xs tooltip">
                  <span>
                    {isMusicOn 
                      ? (activeMusicPersona === "Professional" ? "Office Music On" : "Cafe Music On") 
                      : "Music Off"}
                  </span>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Settings */}
        <div className="settings-item">
          <TooltipProvider delayDuration={70}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings">
                  <div className="sidebar-icon">
                    <Settings size={35} />
                    {isExpanded && <span>Settings</span>}
                  </div>
                </Link>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right" className="px-3 py-1.5 text-xs tooltip">
                  <span>Go to Settings</span>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Display fetched user info */}
        <div className="user-section">
          <div className="sidebar-icon">
            <Image
              src="/icons/user-placeholder.png"
              alt="User"
              width={32}
              height={32}
              className="sidebar-custom-icon"
              priority
            />
            {isExpanded && (
              <div className="user-info">
                <span className="username">{user?.username || "User"}</span>
                <span className="user-email">{user?.email || "No Email"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}