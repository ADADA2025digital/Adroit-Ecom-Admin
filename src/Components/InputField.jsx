// InputField.jsx
import React from "react";
import { Form } from "react-bootstrap";

const InputField = ({
  label,
  type,
  id,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled,
  isInvalid,
  errorMessage,
  required,
}) => {
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>{label}{required && <span className="text-danger"> *</span>}</Form.Label>
      <Form.Control
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        isInvalid={isInvalid}
      />
      {isInvalid && (
        <Form.Control.Feedback type="invalid" className="d-block">
          {errorMessage}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

export default InputField;
