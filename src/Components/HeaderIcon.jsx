import React from "react";
import "../Assets/Styles/Style.css";

const HeaderIcon = ({ type, className = "", onClick }) => {
  return (
    <div className="header-icon text-white d-flex align-items-center justify-content-center p-2 rounded-circle">
      <i className={`bi ${type} ${className}`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
      ></i>
    </div>
  );
};

export default HeaderIcon;