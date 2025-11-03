import React from "react";
import PropTypes from "prop-types";

const Icon = ({ type, className = "", ...props }) => {
  return (
    <div className="icon-container curser-pointer d-flex align-items-center justify-content-center p-2 rounded-1">
      <i className={`bi ${type} ${className}`} {...props}></i>
    </div>
  );
};

Icon.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string, 
};

export default Icon;
