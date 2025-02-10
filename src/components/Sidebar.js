"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "@/styles/SideBar.css";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/Tooltip";
// icons
import { AlignLeft, AlignRight, ChevronDown, Settings, UserPen } from "lucide-react";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  // TODO: persona/gender logic
  const [selectedPersona, setSelectedPersona] = useState("casual-female");

  const toggleSidebar = () => {
    if (isExpanded) {
      setOpenSubmenus({});
    }
    setIsExpanded(!isExpanded);
  };

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

  const menuItems = [
    {
      id: "gender",
      label: "Select Gender",
      icon: "/icons/gender-icon.png",
      submenu: ["Female", "Male"],
    },
    {
      id: "persona",
      label: "Select Persona",
      icon: "/icons/personas-icon.png",
      submenu: ["Casual", "Workplace"],
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
                    <div key={subItem} className="submenu-item">
                      {subItem}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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

        {/* TODO: Replace with actual user info */}
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
                <span className="username">BahasaBuddy</span>
                <span className="user-email">bahasabuddy@gmail.com</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}