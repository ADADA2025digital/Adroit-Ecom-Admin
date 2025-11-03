import React, { useState, useEffect } from "react";
import "../assets/Styles/Style.css";
import Profile from "../Assets/Images/profile.png";
import api from "../config/axiosConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaEnvelope,
  FaPhone,
  FaUser,
  FaIdBadge,
  FaMapMarkerAlt,
  FaLock,
} from "react-icons/fa";
import ButtonGlobal from "../Components/Button";

const UserAccount = () => {
  const [userData, setUserData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    user_id: "",
  });

  const [billingData, setBillingData] = useState({
    address: "",
    suburb: "",
    postcode: "",
    state: "",
  });

  const [loading, setLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    api
      .get("/auth/user")
      .then((response) => {
        const { user, billing } = response.data;

        setUserData({
          firstname: user.firstname || "",
          lastname: user.lastname || "",
          email: user.email || "",
          phone: user.phone || "",
          user_id: user.user_id || "",
        });

        if (billing) {
          setBillingData({
            address: billing.address || "",
            suburb: billing.suburb || "",
            postcode: billing.postcode || "",
            state: billing.state || "",
          });
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
        setLoading(false);
      });
  }, []);

  return (
    <div className="container my-5" style={{ backgroundColor: "transparent" }}>
      <ToastContainer position="top-right" autoClose={3000} />

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted fs-5">Loading profile...</p>
        </div>
      ) : (
        <div className="row d-flex align-items-center justify-content-center w-100 p-4">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-3">
              <div className="card-header headcard text-white text-center border-0 rounded-top-3">
                <h1 className="fs-4 fw-bold m-0 d-flex align-items-center justify-content-center gap-2">
                  <FaUser /> My Profile
                </h1>
              </div>

              <div className="card-body p-4 text-center">
                <div
                  className="profile-image-wrapper mx-auto mb-2 border border-3 rounded-circle shadow-sm"
                  style={{ width: "130px", height: "130px" }}
                >
                  <img
                    src={Profile}
                    alt="User"
                    className="rounded-circle img-fluid"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                <h2 className="fs-5 fw-bold mb-1">
                  {userData.firstname} {userData.lastname}
                </h2>
                <p className=" mb-4 ">@{userData.user_id}</p>

                <div className="row">
                  {/* Left Side: Email, Phone, User ID */}
                  <div className="col-md-6 text-start ps-3">
                    <p className="mb-2 d-flex align-items-center gap-2">
                      <FaEnvelope className="icon-theme" /> {userData.email}
                    </p>
                    <p className="mb-2 d-flex align-items-center gap-2">
                      <FaPhone className="icon-theme" /> {userData.phone}
                    </p>
                    <p className="mb-3 d-flex align-items-center gap-2">
                      <FaIdBadge className="icon-theme" /> User ID:{" "}
                      {userData.user_id}
                    </p>
                  </div>
                  {/* Right Side: Billing Address */}
                  <div className="col-md-6 text-start ps-3">
                    <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                      <FaMapMarkerAlt className="icon-theme" /> Billing Address
                    </h6>
                    <p className="mb-1">{billingData.address}</p>
                    <p className="mb-0">
                      {billingData.suburb}, {billingData.state}{" "}
                      {billingData.postcode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-footer text-center bg-transaparent border-0">
                <ButtonGlobal
                  type="button"
                  text="Change Password"
                  className="btn button-global"
                  onClick={() => (window.location.href = "/forgetpassword")}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccount;
