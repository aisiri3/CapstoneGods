"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import "@/styles/SideBar.css";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/Tooltip";
// icons
import { AlignLeft, AlignRight, ChevronDown, Settings, UserPen, Check } from "lucide-react";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [user, setUser] = useState(null); // Store user data
  const [isSending, setIsSending] = useState(false);
  
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
    } else {
      // If no stored selections, save the defaults
      localStorage.setItem("userSelections", JSON.stringify(defaultSelections));
    }
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
    setSelections(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  // Function to check if selections have changed from last saved state
  const hasSelectionChanged = () => {
    return Object.keys(selections).some(key => 
      selections[key] !== lastSavedSelections[key]
    );
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
    
    // Dispatch a custom event to notify other components about the selection change
    const event = new CustomEvent('avatarSelectionChanged', { 
      detail: { ...selections }
    });
    window.dispatchEvent(event);
    
    // Close any open submenus
    setOpenSubmenus({});
    
    // Provide feedback
    if (success) {
      alert("Your selection has been saved!");
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
              width={35}
              height={35}
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