import React from "react";
import { Eye, EyeSlash, ExclamationCircle } from "react-bootstrap-icons";

const PasswordField = ({
  label,
  id,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  showPassword,
  onTogglePassword,
  isValid,
  autoComplete
}) => {
  return (
    <div className="mb-3 position-relative">
      {label && (
        <label htmlFor={id} className="form-label d-block">
          {label}
        </label>
      )}
      <div className="position-relative">
        <input
          type={showPassword ? "text" : "password"}
          className={`form-control ${error ? "is-invalid" : ""} ${isValid && !error ? "is-valid" : ""}`}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          style={{ paddingRight: "40px" }}
        />
        {/* Eye toggle button */}
        <button
          type="button"
          className="btn position-absolute"
          onClick={onTogglePassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
          style={{ 
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            padding: "0",
            zIndex: 5
          }}
        >
          {showPassword ? <EyeSlash size={18} className="text-secondary" /> : <Eye size={18} className="text-secondary" />}
        </button>
      </div>

      {/* Error message with icon */}
      {error && (
        <div className="d-flex align-items-center text-danger mt-1" style={{ fontSize: "0.875rem" }}>
          <ExclamationCircle size={16} className="me-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PasswordField;
