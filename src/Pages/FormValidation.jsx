import React, { useState } from "react";
import "../Assets/Styles/Style.css";
import InputField from "../Components/InputField";
import ButtonGlobal from "../Components/Button";
import TextAreaField from "../Components/TextAreaField";
import CheckboxField from "../Components/CheckboxField";
import RadioButtonGroup from "../Components/RadioButtonGroup";

const FormValidation = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    zip: "",
    url: "",
    date: "",
    time: "",
    password: "",
    description: "",
    radio: "",
    checkbox: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData({ ...formData, [name]: newValue });

    validateField(name, newValue);
  };

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "fullname":
        if (!value.trim()) {
          error = "Full Name is required";
        } else if (value.trim().length < 3) {
          error = "Full Name must be at least 3 characters";
        }
        break;

      case "email":
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!value.trim()) {
          error = "Email is required";
        } else if (!emailRegex.test(value.trim())) {
          error = "Enter a valid email address";
        }
        break;

      case "phone":
        const phoneRegex = /^\d{10,15}$/;
        if (!value.trim()) {
          error = "Phone number is required";
        } else if (!phoneRegex.test(value.trim())) {
          error = "Enter a valid phone number (10-15 digits)";
        }
        break;

      case "zip":
        const zipRegex = /^\d{5,10}$/;
        if (!value.trim()) {
          error = "Zip code is required";
        } else if (!zipRegex.test(value.trim())) {
          error = "Enter a valid zip code (5-10 digits)";
        }
        break;

      case "url":
        const urlRegex =
          /^(https?:\/\/)?([\w\d\-]+\.)+\w{2,}(\/[\w\d\-._~:/?#[\]@!$&'()*+,;=.]*|\/)?$/;
        if (!value.trim()) {
          error = "URL is required";
        } else if (!urlRegex.test(value.trim())) {
          error = "Enter a valid URL";
        }
        break;

      case "date":
        if (!value) {
          error = "Date is required";
        }
        break;

      case "time":
        if (!value) {
          error = "Time is required";
        }
        break;

      case "password":
        if (!value.trim()) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        }
        break;

      case "description":
        if (!value.trim()) {
          error = "Description is required";
        }
        break;

      case "radio":
        if (!value.trim()) {
          error = "Payment option is required";
        }
        break;

      case "checkbox":
        if (!value) {
          error = "You must agree to the terms and conditions";
        }
        break;

      default:
        break;
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  const validate = () => {
    let newErrors = {};

    Object.keys(formData).forEach((name) => {
      validateField(name, formData[name]);
      if (!formData[name] || errors[name]) {
        newErrors[name] = errors[name] || "This field is required";
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Form Data Submitted:", formData);
    }
  };

  return (
    <section className="pt-3">
      <div className="card">
        <div className="card-header">
          <h4 className="py-3 fw-bold">Validation Form</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="py-0">
            <div className="row p-3">
              {/* Full Name */}
              <InputField
                label="Full Name"
                type="text"
                id="fullname"
                name="fullname"
                placeholder="Full name"
                value={formData.fullname}
                onChange={handleChange}
                error={errors.fullname}
                required={true}
              />

              {/* Email */}
              <InputField
                label="Email"
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required={true}
              />

              {/* Phone Number */}
              <InputField
                label="Phone Number"
                type="tel"
                id="phone"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required={true}
              />

              {/* Address */}
              <InputField
                label="Address"
                type="text"
                id="address"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                required={true}
              />

              <div className="row">
                {/* City */}
                <div className="col-md-4">
                  <InputField
                    label="City"
                    type="text"
                    id="city"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    required={true}
                  />
                </div>

                {/* Country */}
                <div className="col-md-4">
                  <InputField
                    label="Country"
                    type="text"
                    id="country"
                    name="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleChange}
                    error={errors.country}
                    required={true}
                  />
                </div>

                {/* Zip Code */}
                <div className="col-md-4">
                  <InputField
                    label="Zip Code"
                    type="text"
                    id="zip"
                    name="zip"
                    placeholder="Zip code"
                    value={formData.zip}
                    onChange={handleChange}
                    error={errors.zip}
                    required={true}
                  />
                </div>
              </div>

              {/* URL */}
              <InputField
                label="Website URL"
                type="url"
                id="url"
                name="url"
                placeholder="Website URL"
                value={formData.url}
                onChange={handleChange}
                error={errors.url}
                required={true}
              />

              {/* Date */}
              <InputField
                label="Date"
                type="date"
                id="date"
                name="date"
                placeholder="Date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                required={true}
              />

              {/* Time */}
              <InputField
                label="Time"
                type="time"
                id="time"
                name="time"
                placeholder="Time"
                value={formData.time}
                onChange={handleChange}
                error={errors.time}
                required={true}
              />

              {/* Password */}
              <InputField
                label="Password"
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required={true}
              />

              {/* Description */}
              <TextAreaField
                label="Description"
                id="description"
                name="description"
                placeholder="Description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                error={errors.description}
                required={true}
              />

              {/* Payment Option */}
              <RadioButtonGroup
                label="Select your payment method"
                name="radio"
                options={["MasterCard", "VISA"]}
                selectedValue={formData.radio}
                onChange={handleChange}
                error={errors.radio}
                required={true}
                className="py-3"
              />

              {/* Checkbox */}
              <CheckboxField
                label="Agree to terms and conditions"
                id="checkbox"
                name="checkbox"
                checked={formData.checkbox}
                onChange={handleChange}
                error={errors.checkbox}
                required={true}
                style={{ marginLeft: "15px" }}
              />

              <div className="text-center py-3">
                <ButtonGlobal
                  type="submit"
                  text="Submit"
                  className="btn text-white"
                  style={{ backgroundColor: "#7a70ba" }}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default FormValidation;
