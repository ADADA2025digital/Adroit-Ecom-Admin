import React from "react";
import "../Assets/Styles/Style.css";

const RadioButtonGroup = ({ label, name, options, selectedValue, onChange, className, style, id, error }) => {
  return (
    <div className={`mb-3 ${className}`} style={style} id={id}>
      <label className="form-label d-block">{label}</label>
      <div>
        {options.map((option, index) => (
          <div key={index} className="form-check">
            <input
              type="radio"
              id={`${name}-${index}`}
              name={name}
              value={option}
              className="form-check-input"
              checked={selectedValue === option}
              onChange={onChange}
            />
            <label htmlFor={`${name}-${index}`} className="form-check-label">
              {option}
            </label>
            {error && <div className="text-danger mt-1" style={{textAlign: 'left'}}>{error}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadioButtonGroup;