import React, { useState } from "react";
import api from "../config/axiosConfig.jsx";
import Cookies from "js-cookie";
import { Carousel } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import loginData from "../Constants/Data";
import logoImage from "../Assets/Images/logowhite.png";
import InputField from "../Components/InputField";
import PasswordField from "../Components/PasswordField";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    login: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const navigate = useNavigate();

  // Validation rules
  const validationRules = {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
    password: {
      minLength: 6,
      message: "Password must be at least 6 characters",
    },
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field in real-time (not just when touched)
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
      login: "", // Clear login error when user types
    }));
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return ""; // No validation rule for this field

    // Check if field is empty
    if (!value.trim()) {
      return "This field is required";
    }

    if (name === "email" && !rule.pattern.test(value)) {
      return rule.message;
    }

    if (name === "password" && value.length < rule.minLength) {
      return rule.message;
    }

    return ""; // No error
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate each field
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    // Mark all fields as touched to show errors
    setTouched({
      email: true,
      password: true,
    });

    return isValid;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await api.post("/login", {
        email: formData.email,
        password: formData.password,
      });

      // Check if user has admin role (role_id = 1)
      if (response.data.data.role_id !== 1) {
        setErrors((prev) => ({
          ...prev,
          login: "Access denied. Admin privileges required.",
        }));
        setIsSubmitting(false);
        return;
      }

      // Store authentication data
      Cookies.set("token", response.data.token, { expires: 1, secure: true });
      Cookies.set("user_id", response.data.data.user_id, {
        expires: 1,
        secure: true,
      });
      Cookies.set("role_id", response.data.data.role_id, {
        expires: 1,
        secure: true,
      });

      // Store in localStorage for better persistence
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("userData", JSON.stringify(response.data.data));
      localStorage.setItem("authenticated", "true");

      // Redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        if (error.response.status === 401) {
          setErrors((prev) => ({
            ...prev,
            login: "Invalid email or password",
          }));
        } else if (error.response.status === 500) {
          setErrors((prev) => ({
            ...prev,
            login: "Server error. Please try again later.",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            login: error.response.data.message || "Login failed",
          }));
        }
      } else if (error.request) {
        setErrors((prev) => ({
          ...prev,
          login: "Network error. Please check your connection.",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          login: "An unexpected error occurred",
        }));
      }
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
        <div className=" boxstyle col-md-6 d-flex flex-column justify-content-center align-items-center text-white animated-bg ">
          {/* Logo */}
          <img
            src={logoImage}
            alt="Logo"
            className="mt-3 p-1"
            style={{ height: "60px" }}
          />

          {/* Carousel */}
          <div className="w-100 px-2 py-4 px-md-4 ">
            <Carousel
              controls={false}
              indicators={false}
              interval={4000}
              fade={false}
              className="w-100"
            >
              {loginData.map((item, index) => (
                <Carousel.Item key={index}>
                  <div className="text-center px-2 px-md-4">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </div>
        </div>

        {/* Right Side Login Form */}
        <div className="col-md-6 p-5 bg-white d-flex flex-column justify-content-center">
          <h3 className="mb-4 text-center logintxt">Login</h3>
          {errors.login && (
            <div className="alert alert-danger" role="alert">
              {errors.login}
            </div>
          )}
          <form onSubmit={handleFormSubmit} autoComplete="on">
            <InputField
              label="Email Address"
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              error={errors.email}
              className={
                touched.email && !errors.email && formData.email
                  ? "is-valid"
                  : ""
              }
            />

            <PasswordField
              label="Password"
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleBlur}
              error={errors.password}
              showPassword={showPassword}
              onTogglePassword={togglePasswordVisibility}
              isValid={
                touched.password && !errors.password && formData.password
              }
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
                    {/* Logging in... */}
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>

            <div className="d-flex justify-content-center align-items-center mt-2">
              <a href="/forgetpassword" className="text-decoration-none">
                Forgot Password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
