import React, { useState } from "react";
import InputField from "../Components/InputField";
import logoImage from "../Assets/Images/logowhite.png";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import api from "../config/axiosConfig";

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    submit: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  // ✅ EmailJS credentials
  const EMAILJS_CONFIG = {
    SERVICE_ID: "service_icsecqd",
    TEMPLATE_ID: "template_2azoziq",
    PUBLIC_KEY: "x81NpKL7Q438yTjZK",
  };

  // Validation rules
  const validationRules = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
      submit: "",
    }));
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return "";

    if (!value.trim()) {
      return "This field is required";
    }

    if (name === "email" && !rule.pattern.test(value)) {
      return rule.message;
    }

    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Call your API to get OTP and token
      const response = await api.post("/forgot-password", {
        email: formData.email,
      });

      if (response.data.status === 200) {
        const { token, otp } = response.data;

        // Store token and email in localStorage
        // localStorage.setItem("reset_token", token);
        // localStorage.setItem("reset_email", formData.email);
        // localStorage.setItem("reset_otp", otp);

        // Prepare email template parameters with clickable button
        const resetLink = `${
          window.location.origin
        }/resetpassword?token=${token}&email=${encodeURIComponent(
          formData.email
        )}`;

        const templateParams = {
          to_email: formData.email,
          otp: otp,
          reset_link: resetLink,
          from_name: "Your App Name",
          to_name: formData.email.split("@")[0],
          reply_to: "noreply@yourapp.com",
           year: new Date().getFullYear(),
        };

        // Initialize EmailJS
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

        // Send email
        const emailResponse = await emailjs.send(
          EMAILJS_CONFIG.SERVICE_ID,
          EMAILJS_CONFIG.TEMPLATE_ID,
          templateParams
        );

        if (emailResponse.status === 200 || emailResponse.status === 0) {
          setEmailSent(true);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setErrors((prev) => ({
        ...prev,
        submit:
          error.response?.data?.message ||
          "Failed to send reset instructions. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div
        className="row w-75 shadow rounded overflow-hidden"
        style={{ minHeight: "70vh" }}
      >
        {/* Left Animated Background */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-white boxstyle animated-bg">
          <img
            src={logoImage}
            alt="Logo"
            className="mt-3 p-1"
            style={{ height: "60px" }}
          />
          <h4 className="mt-4 text-center">Forgot Your Password?</h4>
          <p className="text-center px-4">
            {emailSent
              ? "Check your email for reset instructions"
              : "Enter your email address and we'll send you instructions to reset your password."}
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="col-md-6 p-5 bg-white d-flex flex-column justify-content-center">
          {emailSent ? (
            // Success UI after email is sent
            <div className="text-center">
              <div className="mb-4">
                <i className="bi bi-envelope-check fs-1 text-primary"></i>
              </div>
              <h3 className="mb-3 text-center logintxt">Check Your Email</h3>
              <p className="mb-4">
                We've sent password reset instructions to
                <br />
                <strong>{formData.email}</strong>
              </p>
              <p className="text-muted small mb-4">
                Didn't receive the email? Check your spam folder or{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setEmailSent(false);
                  }}
                  className="text-decoration-none"
                >
                  try again
                </a>
              </p>
              {/* <div className="mt-4">
                <a href="/login" className="btn loginbtn px-4">
                  Back to Login
                </a>
              </div> */}
            </div>
          ) : (
        
            <>
              <h3 className="mb-4 text-center logintxt">Reset Password</h3>
              {errors.submit && (
                <div className="alert alert-danger">{errors.submit}</div>
              )}
              <form onSubmit={handleFormSubmit}>
                <InputField
                  label="Email Address"
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  error={errors.email}
                />
                <div className="text-center">
                  <button
                    type="submit"
                    className="btn loginbtn mt-3 px-4"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Sending...
                      </>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
