import React from "react";
import "../Assets/Styles/Style.css";

const CheckboxField = ({ label, id, name, checked, onChange, className, style, error }) => {
  return (
    <div className={`mb-3 form-check d-flex gap-2 align-items-center ${className}`} style={style}>
      <input
        type="checkbox"
        id={id}
        name={name}
        className="m-0"
        checked={checked}
        onChange={onChange}
        style={{padding: "5px"}}
      />
      <label htmlFor={id} className="form-label d-block">
        {label}
      </label>
      {error && <div className="text-danger mt-1" style={{textAlign: 'left'}}>{error}</div>}
    </div>
  );
};

export default CheckboxField;