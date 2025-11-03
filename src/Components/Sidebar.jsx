import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Assets/Styles/Style.css";
import SideBarLink from "./SideBarLink";
import Icon from "./SideBarIcon";
 
const Sidebar = ({
  isSidebarVisible,
  setIsSidebarVisible,
  collapsed,
  setCollapsed,
  isMobile,
}) => {
  const [activeSection, setActiveSection] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const sidebarRef = useRef(null);
 
  const handleToggle = (label) => {
    setActiveSection(activeSection === label ? null : label);
  };
 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobile &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsSidebarVisible(false);
      }
    };
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsSidebarVisible, isMobile]);
 
  // ✅ Sidebar auto-hide on link click (passed to SideBarLink)
  const handleItemClick = () => {
    if (isMobile) setIsSidebarVisible(false);
  };
 
  return (
    <aside
      ref={sidebarRef}
      className={`sidebar d-flex flex-column text-white position-fixed ${
        collapsed && !isHovered ? "collapsed" : "expanded"
      } ${isSidebarVisible ? "show-sidebar" : "hide-sidebar"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="sidebar-body flex-grow-1 overflow-y-auto px-3 pt-3">
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              className="nav-link d-flex align-items-center text-white p-0 py-2"
              to="/"
              onClick={() => setActiveSection(null)}
            >
              <div className="d-flex align-items-center flex-grow-1">
                <Icon type="bi-house" />
                {!collapsed && <span className="px-3">Dashboard</span>}
              </div>
            </Link>
          </li>
        </ul>
 
        <ul className="nav flex-column">
          <SideBarLink
            iconType="bi-box-seam"
            label="Products"
            isExpanded={activeSection === "Products"}
            onToggle={() => handleToggle("Products")}
            subItems={[
              { label: "Category", to: "/category" },
              { label: "Product list", to: "/productlist" },
            ]}
            collapsed={collapsed && !isHovered}
            onItemClick={handleItemClick}
          />
        </ul>
 
        <ul className="nav flex-column">
          <SideBarLink
            iconType="bi-cart-check"
            label="Orders"
            isExpanded={activeSection === "Orders"}
            onToggle={() => handleToggle("Orders")}
            subItems={[{ label: "Order list", to: "/orderlist" }]}
            collapsed={collapsed && !isHovered}
          />
        </ul>
 
        <ul className="nav flex-column">
          <SideBarLink
            iconType="bi-bar-chart-line"
            label="Sales"
            isExpanded={activeSection === "Sales"}
            onToggle={() => handleToggle("Sales")}
            subItems={[
              { label: "Transaction", to: "/transaction" },
              { label: "Refund", to: "/refund" },
            ]}
            collapsed={collapsed && !isHovered}
          />
        </ul>
 
        <ul className="nav flex-column">
          <SideBarLink
            iconType="bi-people"
            label="Users"
            isExpanded={activeSection === "Users"}
            onToggle={() => handleToggle("Users")}
            subItems={[{ label: "User list", to: "/userlist" }]}
            collapsed={collapsed && !isHovered}
          />
        </ul>

         <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              className="nav-link d-flex align-items-center text-white p-0 py-2"
              to="/report"
              onClick={() => setActiveSection(null)}
            >
              <div className="d-flex align-items-center flex-grow-1">
                <Icon type="bi bi-file-text" />
                {!collapsed && <span className="px-3">Report</span>}
              </div>
            </Link>
          </li>
        </ul>


           <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              className="nav-link d-flex align-items-center text-white p-0 py-2"
              to="/review"
              onClick={() => setActiveSection(null)}
            >
              <div className="d-flex align-items-center flex-grow-1">
                <Icon type="bi bi-pen" />
                {!collapsed && <span className="px-3">Review</span>}
              </div>
            </Link>
          </li>
        </ul>

      </div>
 
      {!collapsed && (
        <div className="sidebar-footer d-flex justify-content-center align-items-center p-3">
          <p className="mb-0" style={{ fontSize: "12px" }}>
              &copy; {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      )}
    </aside>
  );
};
 
export default Sidebar;