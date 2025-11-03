import React, { useState } from "react";
import PropTypes from "prop-types";
import Icon from "./SideBarIcon";
import { Link, useLocation } from "react-router-dom";
 
const SideBarLink = ({
  iconType,
  label,
  isExpanded,
  onToggle,
  subItems = [],
  collapsed,
  onItemClick = () => {},
}) => {
  const location = useLocation();
 
  // Fix: Changed item.href to item.to
  const isAnySubItemActive = subItems.some((item) => location.pathname === item.to);
 
  return (
    <li className="nav-item">
      <div
        className={`nav-link d-flex align-items-center text-white p-0 ${isAnySubItemActive ? "fw-bold" : "py-2"}`}
        onClick={subItems.length > 0 ? onToggle : undefined}
        style={{ cursor: subItems.length > 0 ? "pointer" : "default" }}
      >
        <div className="d-flex align-items-center flex-grow-1">
          <Icon type={iconType} />
          {!collapsed && <span className="px-3">{label}</span>}
        </div>
        {!collapsed && subItems.length > 0 && (
          <i
            className={`bi ${
              isExpanded
                ? "bi-chevron-compact-down"
                : "bi-chevron-compact-right"
            } fs-6`}
            style={{ cursor: "pointer" }}
          ></i>
        )}
      </div>
 
      {isExpanded && !collapsed && subItems.length > 0 && (
        <ul className="nav flex-column position-relative sub-menu ps-2 ms-4 mb-3">
          {subItems.map((item, index) => (
            <li className="position-relative" key={index}>
               {/* Fix: Changed item.href to item.to */}
               <Link
                to={item.to}
                className={`nav-link ps-2 text-decoration-none text-white py-1 d-flex align-items-center ${
                  location.pathname === item.to ? "active fw-bold" : ""
                }`}
                onClick={onItemClick}
              >
                <span className="sub-menu-bullet d-flex align-items-center position-absolute top-50 translate-middle-y"></span>
                <span className="px-2">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};
 
SideBarLink.propTypes = {
  iconType: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  subItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired, // This is the correct prop name
    })
  ),
  collapsed: PropTypes.bool.isRequired,
};
 
export default SideBarLink;