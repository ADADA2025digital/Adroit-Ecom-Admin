import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Assets/Styles/Style.css";
import Logo from "../Assets/Images/logowhite.png";
import Profile from "../Assets/Images/profile.png";
import HeaderIcon from "../Components/HeaderIcon";
import Dropdown from "../Components/Dropdown";
import Icon from "../Components/SideBarIcon";
import MessagePanel from "../Components/MessagePanel";
import Notification from "../Components/Notification";
import Cookies from "js-cookie";
import api from "../config/axiosConfig.jsx";

const Header = ({ setIsSidebarVisible, isSidebarVisible, setCollapsed }) => {
  const [isEnvelopeDropdownOpen, setEnvelopeDropdownOpen] = useState(false);
  const [isBellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [rotate, setRotate] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMessagePanelOpen, setIsMessagePanelOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pollingInterval, setPollingInterval] = useState(null);

  const toggleIconRef = useRef(null);
  const bellDropdownRef = useRef(null);
  const envelopeDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  
  // Use refs for values that need immediate access
  const previousUnreadCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const audioEnabledRef = useRef(false);

  const navigate = useNavigate();

  // Initialize audio system
  useEffect(() => {
    initializeAudioSystem();
    
    // Force enable audio on any user interaction
    const enableAudioOnInteraction = () => {
      if (!audioEnabledRef.current) {
        audioEnabledRef.current = true;
        console.log("🔊 Audio enabled via user interaction");
      }
    };

    document.addEventListener('click', enableAudioOnInteraction);
    document.addEventListener('keydown', enableAudioOnInteraction);
    document.addEventListener('touchstart', enableAudioOnInteraction);

    return () => {
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('keydown', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
    };
  }, []);

  // Initialize Web Audio API for guaranteed playback
  const initializeAudioSystem = async () => {
    try {
      // Create Audio Context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load the notification sound
      await loadAudioBuffer();
      
      audioEnabledRef.current = true;
      console.log("🔊 Audio system initialized successfully");
    } catch (error) {
      console.log("Web Audio API initialization failed:", error);
      // Fallback to HTML5 Audio
      audioEnabledRef.current = true;
    }
  };

  // Load audio file into buffer
  const loadAudioBuffer = async () => {
    try {
      const response = await fetch("/sounds/notification.mp3");
      const arrayBuffer = await response.arrayBuffer();
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      console.log("🔊 Audio buffer loaded successfully");
    } catch (error) {
      console.log("Failed to load audio buffer:", error);
    }
  };

  // Play sound using Web Audio API (most reliable)
  const playSoundWebAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return false;

    try {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();
      
      source.buffer = audioBufferRef.current;
      gainNode.gain.value = 0.7; // 70% volume
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.start(0);
      console.log("🎵 Sound played via Web Audio API");
      return true;
    } catch (error) {
      console.log("Web Audio playback failed:", error);
      return false;
    }
  };

  // Play sound using HTML5 Audio with multiple strategies
  const playSoundHTML5 = async () => {
    // Strategy 1: Direct audio element
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.7;
      audio.preload = "auto";
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log("🎵 Sound played via HTML5 Audio");
        return true;
      }
    } catch (error) {
      console.log("HTML5 Audio strategy 1 failed:", error);
    }

    return false;
  };

  // Ultimate sound playback with all fallbacks
  const playNotificationSound = async () => {
    if (!audioEnabledRef.current) {
      console.log("❌ Audio not enabled, skipping sound");
      return;
    }

    console.log("🔊 Attempting to play notification sound...");

    // Try Web Audio API first (most reliable)
    if (playSoundWebAudio()) {
      return;
    }

    // Try HTML5 Audio fallbacks
    if (await playSoundHTML5()) {
      return;
    }

    console.log("❌ All audio playback methods failed");
  };

  // Fetch unread count for notification badge - FIXED VERSION
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      if (response.data.success) {
        const newCount = response.data.unread_count || 0;
        const previousCount = previousUnreadCountRef.current;
        const isFirstLoad = isFirstLoadRef.current;
        const audioEnabled = audioEnabledRef.current;
        
        console.log(`📊 Unread count: ${newCount}, Previous: ${previousCount}, First load: ${isFirstLoad}, Audio enabled: ${audioEnabled}`);
        
        // Check if count increased AND it's not the first load
        if (newCount > previousCount && !isFirstLoad) {
          console.log(`🎯 NEW NOTIFICATION! Count increased from ${previousCount} to ${newCount}`);
          await playNotificationSound();
        }
        
        // Update state and refs
        setUnreadCount(newCount);
        previousUnreadCountRef.current = newCount;
        
        // Mark first load as complete after first successful fetch
        if (isFirstLoadRef.current) {
          isFirstLoadRef.current = false;
          console.log("✅ First load completed, sound will play for future increases");
        }
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  // Start polling for unread count updates
  const startPolling = () => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Fetch immediately (this is the first load - no sound)
    fetchUnreadCount();
    
    // Set up new interval (poll every 30 seconds)
    const interval = setInterval(fetchUnreadCount, 30000);
    setPollingInterval(interval);
    
    console.log("🔄 Started polling for notifications every 30 seconds");
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const toggleBellDropdown = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setBellDropdownOpen(false);
    setEnvelopeDropdownOpen(false);
    setProfileDropdownOpen(false);
    
    // Force audio enable on bell click
    if (!audioEnabledRef.current) {
      audioEnabledRef.current = true;
      console.log("🔊 Audio enabled via bell click");
    }
    
    // When opening notifications, refresh count and stop polling temporarily
    if (!isNotificationOpen) {
      fetchUnreadCount();
    }
  };

  const toggleEnvelopeDropdown = () => {
    setEnvelopeDropdownOpen(!isEnvelopeDropdownOpen);
    setBellDropdownOpen(false);
    setProfileDropdownOpen(false);
  };

  const toggleMessagePanel = () => {
    setIsMessagePanelOpen((prev) => !prev);
    setBellDropdownOpen(false);
    setEnvelopeDropdownOpen(false);
    setProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!isProfileDropdownOpen);
    setBellDropdownOpen(false);
    setEnvelopeDropdownOpen(false);
  };

  const toggleSidebar = () => {
    setRotate(true);
    setIsSidebarVisible((prev) => !prev);

    setTimeout(() => setRotate(false), 500);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    
    // Start polling when component mounts
    startPolling();
    
    return () => {
      window.removeEventListener("resize", handleResize);
      stopPolling();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        bellDropdownRef.current &&
        !bellDropdownRef.current.contains(event.target) &&
        envelopeDropdownRef.current &&
        !envelopeDropdownRef.current.contains(event.target) &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target) &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setBellDropdownOpen(false);
        setEnvelopeDropdownOpen(false);
        setProfileDropdownOpen(false);
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Stop polling before logout
    stopPolling();

    // Clear localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("authenticated");

    // Clear cookies (using js-cookie)
    Cookies.remove("token");
    Cookies.remove("user_id");
    Cookies.remove("role_id");

    window.location.href = "/login";
  };

  const handleFullScreenToggle = () => {
    setIsFullScreen(!isFullScreen);
  };

  const toggleDarkMode = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      document.body.classList.toggle("dark-mode", newMode);
      localStorage.setItem("darkMode", newMode);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.body.classList.add("dark-mode");
    }
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(`Error attempting to disable full-screen mode: ${err.message}`);
      });
    }
  };

  const handleNotificationClose = () => {
    setIsNotificationOpen(false);
    // Refresh unread count when notification panel closes and restart polling
    fetchUnreadCount();
    startPolling();
  };

  // Test sound function (for debugging)
  const testSound = () => {
    console.log("🔊 Testing sound playback...");
    audioEnabledRef.current = true; // Force enable for test
    playNotificationSound();
  };

  return (
    <>
      {isLoading && (
        <div className="backdrop">
          <div className="spinner"></div>
        </div>
      )}
      
      {/* Hidden test button for debugging */}
      {/* {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={testSound}
          style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            zIndex: 9999,
            padding: '5px 10px',
            fontSize: '12px',
            opacity: 0.7
          }}
          className="btn btn-warning btn-sm"
        >
          Test Sound
        </button>
      )} */}

      <nav className="navbar-top navbar navbar-expand-lg fixed-top d-flex align-items-center justify-content-between py-2 px-3">
        <div className="d-flex align-items-center justify-content-between gap-2">
          {!isMobile && (
            <Icon
              type="bi-grid"
              className={`fs-6 text-white cursor-pointer ${
                rotate ? "icon-rotate" : ""
              }`}
              onClick={() => {
                setCollapsed((prev) => !prev);
                setIsSidebarVisible(true);
                setRotate(true);
                setTimeout(() => setRotate(false), 500);
              }}
              style={{ cursor: "pointer" }}
            />
          )}
          {isMobile && (
            <Icon
              ref={toggleIconRef}
              type="bi-list"
              className={`fs-6 rounded circle text-white cursor-pointer ${
                rotate ? "icon-rotate" : ""
              }`}
              onClick={toggleSidebar}
            />
          )}
          {isMobile && <h4 className="text-white m-0">ADROID Dashboard</h4>}

          {!isMobile && (
            <a className="navbar-brand d-flex align-items-center gap-2" href="/">
              <Link to="/">
                {!isMobile && (
                  <img
                    src={Logo}
                    className="ms-3"
                    alt="Brand Logo"
                    style={{ height: "50px" }}
                  />
                )}
              </Link>
            </a>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-between gap-3">
          {!isMobile && (
            <HeaderIcon
              type="bi-arrows-fullscreen"
              onClick={() => {
                handleFullScreenToggle();
                toggleFullScreen();
              }}
            />
          )}

          {/* Notification Bell Icon with Badge */}
          {!isMobile && (
            <div ref={bellDropdownRef} style={{ position: 'relative' }}>
              <div className="position-relative">
                <HeaderIcon 
                  type="bi-bell" 
                  onClick={toggleBellDropdown}
                />
                {unreadCount > 0 && (
                  <span 
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{
                      fontSize: '0.65rem',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #fff',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </div>
          )}

          {!isMobile && (
            <HeaderIcon
              type={isDarkMode ? "bi-brightness-high" : "bi-moon-stars"}
              onClick={toggleDarkMode}
            />
          )}

          <div ref={profileDropdownRef}>
            <img
              src={Profile}
              alt="User Profile"
              className="rounded-circle"
              style={{ width: "40px", height: "40px", cursor: "pointer" }}
              onClick={toggleProfileDropdown}
            />
            {isProfileDropdownOpen && (
              <div className="dropdown-menu top-100 position-absolute end-0 py-2 d-block shadow">
                <Link 
                  to="/useraccount" 
                  className="dropdown-item d-flex align-items-center"
                >
                  <i className="bi bi-person me-3"></i> Account
                </Link>
                <button
                  className="dropdown-item d-flex align-items-center border-0 bg-transparent"
                  onClick={handleLogout}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-box-arrow-right me-3"></i> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="navbar fixed-bottom d-flex justify-content-around py-2 px-3">
          <Link to="/">
            <HeaderIcon type="bi-house" />
          </Link>
          
          {/* Mobile Notification Bell Icon with Badge */}
          <div ref={bellDropdownRef} style={{ position: 'relative' }}>
            <div className="position-relative">
              <HeaderIcon 
                type="bi-bell" 
                onClick={toggleBellDropdown}
              />
              {unreadCount > 0 && (
                <span 
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{
                    fontSize: '0.65rem',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </div>

          <HeaderIcon
            type={isDarkMode ? "bi-brightness-high" : "bi-moon-stars"}
            onClick={toggleDarkMode}
          />
        </nav>
      )}

      {/* Notification Panel */}
      {isNotificationOpen && (
        <div ref={notificationRef}>
          <Notification 
            onClose={handleNotificationClose}
            style={{
              position: 'fixed',
              top: '60px',
              right: '20px',
              height: 'calc(100vh - 80px)'
            }}
          />
        </div>
      )}
    </>
  );
};

export default Header;