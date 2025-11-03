import React, { useState, useEffect } from "react";
import InputField from "../Components/InputField";
import PasswordField from "../Components/PasswordField";
import logoImage from "../Assets/Images/logowhite.png";
import api from "../config/axiosConfig";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword = () => {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if token and email are in URL parameters
  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (token && email) {
      localStorage.setItem("reset_token", token);
      localStorage.setItem("reset_email", decodeURIComponent(email));
    }
  }, [searchParams]);

  const validationRules = {
    otp: {
      required: true,
      pattern: /^[0-9]{6}$/,
      message: `OTP must be a 6-digit number`,
    },
    password: {
      required: true,
      pattern: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
      message: `Password: min 8 chars, 1 uppercase & 1 number`,
    },
    confirmPassword: {
      required: true,
      matchWith: "password",
      message: `Passwords do not match`,
    },
  };

  const validateField = (name, value, allValues = {}) => {
    const rule = validationRules[name];
    if (!rule) return "";

    if (rule.required && !value.trim()) {
      return "This field is required";
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message;
    }

    if (rule.matchWith && value !== allValues[rule.matchWith]) {
      return rule.message;
    }

    return "";
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formValues = { otp, password, confirmPassword };
    const validationErrors = {};

    Object.keys(formValues).forEach((field) => {
      const error = validateField(field, formValues[field], formValues);
      if (error) validationErrors[field] = error;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // Get stored values from localStorage
    const storedEmail = localStorage.getItem("reset_email");
    const storedToken = localStorage.getItem("reset_token");

    if (!storedEmail || !storedToken) {
      setErrorMessage("Reset session expired. Please request a new OTP.");
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Make API call to reset password
      const response = await api.post("/reset-password", {
        email: storedEmail,
        otp: otp,
        token: storedToken,
        password: password,
        password_confirmation: confirmPassword,
      });

      if (response.data.status === 200) {
        setSuccessMessage("Password reset successfully!");

        // Clear stored values
        localStorage.removeItem("reset_otp");
        localStorage.removeItem("reset_email");
        localStorage.removeItem("reset_token");

        // Redirect to login after a delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("An error occurred. Please try again.");
        }
      } else {
        setErrorMessage("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
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
          <h4 className="mt-4 text-center">Reset Your Password</h4>
          <p className="text-center px-4">
            Enter the OTP sent to your email and create a new password for your
            account.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="col-md-6 p-5 bg-white d-flex flex-column justify-content-center">
          <h3 className="mb-4 text-center logintxt">Reset Password</h3>
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="alert alert-danger">{errorMessage}</div>
          )}
          <form onSubmit={handleSubmit}>
            <InputField
              label="OTP Code"
              type="text"
              id="otp"
              name="otp"
              placeholder="Enter the OTP sent to your email"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setErrors({
                  ...errors,
                  otp: validateField("otp", e.target.value),
                });
                setErrorMessage("");
              }}
              isInvalid={!!errors.otp} // pass a boolean
              errorMessage={errors.otp} // pass the error text
              required
            />

            <PasswordField
              label="New Password"
              id="password"
              name="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({
                  ...errors,
                  password: validateField("password", e.target.value),
                });
                setErrorMessage("");
              }}
              error={errors.password} // important: pass error message
              showPassword={showPassword}
              onTogglePassword={togglePasswordVisibility}
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({
                  ...errors,
                  confirmPassword: validateField(
                    "confirmPassword",
                    e.target.value,
                    { password } // pass current password for matching
                  ),
                });
                setErrorMessage("");
              }}
              error={errors.confirmPassword} // show error
              showPassword={showConfirmPassword}
              onTogglePassword={toggleConfirmPasswordVisibility}
              autoComplete="new-password"
            />

            <div className="text-center">
              <button
                type="submit"
                className="btn loginbtn mt-3 px-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Resetting...
                  </>
                ) : (
                  "Reset"
                )}
              </button>
            </div>
            {/* <div className="mt-3 text-center">
              <a href="/login" className="text-decoration-none">
                Back to Login
              </a>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
