import "./App.css";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Components/Header";
import Sidebar from "./Components/Sidebar";
import React, { useState, useRef, useEffect } from "react";

export default function RootLayout() {
  const location = useLocation();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const [isFullScreen, setFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setIsSidebarVisible(true);
      else setIsSidebarVisible(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isLoginPage = location.pathname === "/login";

  return (
    <div className="App">
      <div className="content-wrapper container-fluid overflow-y-auto vh-100 p-0">
        {!isLoginPage && (
          <>
            <Header
              setIsSidebarVisible={setIsSidebarVisible}
              isSidebarVisible={isSidebarVisible}
              setCollapsed={setCollapsed}
              collapsed={collapsed}
              sidebarRef={sidebarRef}
              toggleFullScreen={toggleFullScreen}
              isFullScreen={isFullScreen}
            />
            <Sidebar
              setIsSidebarVisible={setIsSidebarVisible}
              isSidebarVisible={isSidebarVisible}
              setCollapsed={setCollapsed}
              collapsed={collapsed}
              isMobile={isMobile}
            />
          </>
        )}
        <div
          className="main-content px-2 pt-2"
          style={{
            zIndex: "999",
            marginTop: !isLoginPage ? "60px" : "0px",
            marginLeft: !isLoginPage ? (collapsed ? "80px" : "250px") : "0px",
            marginBottom: isMobile && !isLoginPage ? "60px" : "",
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}