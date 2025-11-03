import React from "react";
import "../Assets/Styles/Style.css";

const DropdownField = ({ label, id, name, value, onChange, options, className, style, required }) => {
  return (
    <div className={`mb-3 ${className}`} style={style}>
      <label htmlFor={id} className="form-label d-block">
        {label}
      </label>
      <select
        id={id}
        name={name}
        className="form-select"
        value={value}
        onChange={onChange}
        required={required}
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropdownField;