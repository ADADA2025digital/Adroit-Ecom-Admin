import React from "react";
import "../Assets/Styles/Style.css";

const TextAreaField = ({ label, id, name, rows, value, onChange, className, style, required, placeholder, error }) => {
  return (
    <div className={`mb-3 ${className}`} style={style}>
      <label htmlFor={id} className="form-label d-block">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        className={`form-control ${error ? "is-invalid" : ""} ${className}`}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={onChange}
      />
     {error && <div className="text-danger mt-1" style={{textAlign: 'left'}}>{error}</div>}
    </div>
  );
};

export default TextAreaField;