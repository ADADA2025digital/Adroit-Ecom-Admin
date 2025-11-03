import React, { useState, useEffect, useRef } from "react";
import "../Assets/Styles/Style.css";
import api from "../config/axiosConfig.jsx";
import { getCookie } from "../config/utils.jsx";

const Notification = ({ style, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const notificationRef = useRef(null);

  // Check for dark mode on component mount and when body class changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("dark-mode"));
    };

    // Initial check
    checkDarkMode();

    // Observe body class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Close notification when clicking outside
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications");
      
      if (response.data.success) {
        setNotifications(response.data.data || []);
      } else {
        throw new Error("Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, status: "read", read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({
          ...notif,
          status: "read",
          read_at: notif.read_at || new Date().toISOString()
        }))
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notif => notif.notification_id !== notificationId)
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete("/notifications");
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "payment_received":
        return "bi-credit-card text-success";
      case "cancellation_request":
        return "bi-x-circle text-danger";
      case "order_placed":
        return "bi-cart-plus text-primary";
      case "order_shipped":
        return "bi-truck text-info";
      case "order_delivered":
        return "bi-check-circle text-success";
      default:
        return "bi-bell text-warning";
    }
  };

  const getNotificationBadgeColor = (type) => {
    switch (type) {
      case "payment_received":
        return "success";
      case "cancellation_request":
        return "danger";
      case "order_placed":
        return "primary";
      case "order_shipped":
        return "info";
      case "order_delivered":
        return "success";
      default:
        return "warning";
    }
  };

  // Dark mode classes
  const darkModeClasses = isDarkMode ? "dark-mode" : "";
  const headerBgClass = isDarkMode ? "bg-dark border-secondary" : "bg-white border-bottom";
  const bodyBgClass = isDarkMode ? "bg-dark text-light" : "bg-white";
  const footerBgClass = isDarkMode ? "bg-dark border-secondary text-light" : "bg-light border-top";
  const textClass = isDarkMode ? "text-light" : "text-dark";
  const mutedTextClass = isDarkMode ? "text-light" : "text-muted";
  const borderClass = isDarkMode ? "border-secondary" : "border-light";
  const cardBgClass = isDarkMode ? "bg-secondary text-light" : "bg-light";

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => n.status === "unread").length;

  return (
    <div 
      className={`offcanvas offcanvas-end show ${darkModeClasses}`}
      style={{ 
        ...style, 
        width: "400px",
        zIndex: 1050,
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease-in-out",
      }}
      ref={notificationRef}
    >
      {/* Header */}
      <div className={`offcanvas-header ${headerBgClass} border-bottom`}>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="d-flex align-items-center">
            <h5 className={`offcanvas-title fw-bold ${textClass} mb-0 me-2`}>
              Notifications
            </h5>
            {unreadCount > 0 && (
              <span className={`badge bg-danger rounded-pill`}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="d-flex gap-2 align-items-center">
            {notifications.length > 0 && (
              <>
                <button
                  className={`btn btn-sm ${isDarkMode ? "btn-outline-light" : "btn-outline-dark"} d-none d-sm-flex`}
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  title="Mark all as read"
                >
                  <i className="bi bi-check-all me-1"></i>
                  <span className="d-none d-md-inline">Mark all read</span>
                </button>
                <button
                  className={`btn btn-sm btn-outline-danger d-none d-sm-flex`}
                  onClick={clearAllNotifications}
                  title="Clear all notifications"
                >
                  <i className="bi bi-trash me-1"></i>
                  <span className="d-none d-md-inline">Clear all</span>
                </button>
              </>
            )}
            <button
              type="button"
              className={`btn-close ${isDarkMode ? "btn-close-white" : ""}`}
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={`offcanvas-body p-0 ${bodyBgClass}`}>
        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className={`spinner-border ${isDarkMode ? "text-light" : "text-primary"} mb-3`} 
                 role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className={`${mutedTextClass} mb-0`}>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5 px-3">
            <i className={`bi bi-exclamation-triangle display-4 ${isDarkMode ? "text-warning" : "text-warning"} mb-3`}></i>
            <h6 className={`${textClass} mb-2`}>Unable to load notifications</h6>
            <p className={`${mutedTextClass} small mb-3`}>{error}</p>
            <button 
              className={`btn ${isDarkMode ? "btn-outline-light" : "btn-outline-primary"} btn-sm`}
              onClick={fetchNotifications}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-5 px-3">
            <i className={`bi bi-bell display-4 ${mutedTextClass} mb-3`}></i>
            <h6 className={`${textClass} mb-2`}>No notifications</h6>
            <p className={`${mutedTextClass} small mb-0`}>You're all caught up!</p>
          </div>
        ) : (
          <div className="notification-list" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
            {notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`notification-item p-3 border-bottom ${borderClass} ${
                  notification.status === "unread" ? (isDarkMode ? "bg-dark bg-opacity-50" : "bg-light bg-opacity-50") : ""
                }`}
              >
                <div className="d-flex align-items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold position-relative"
                      style={{
                        width: "48px",
                        height: "48px",
                        backgroundColor: notification.status === "unread" ? "#0d6efd" : "#6c757d",
                        fontSize: "14px"
                      }}
                    >
                      {getInitials(notification.data?.customer_name)}
                      {notification.status === "unread" && (
                        <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                          <span className="visually-hidden">New alerts</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center flex-wrap">
                        <span className={`badge bg-${getNotificationBadgeColor(notification.type)} me-2 mb-1`}>
                          {notification.type?.replace(/_/g, ' ')}
                        </span>
                        <h6 className={`mb-0 fw-semibold ${textClass} text-truncate`}>
                          {notification.title}
                        </h6>
                      </div>
                      <small className={`${mutedTextClass} flex-shrink-0 ms-2`}>
                        {formatTime(notification.created_at)}
                      </small>
                    </div>
                    
                    <p className={`mb-2 ${textClass} small`}>
                      {notification.message}
                    </p>

                    {/* Additional data */}
                    {notification.data && (
                      <div className={`rounded p-2 small mb-2 ${cardBgClass}`}>
                        {notification.data.order_id && (
                          <div className="d-flex align-items-center mb-1">
                            <i className="bi bi-receipt me-2"></i>
                            <span className={mutedTextClass}>
                              Order: <strong className={textClass}>{notification.data.order_id}</strong>
                            </span>
                          </div>
                        )}
                        {notification.data.amount && (
                          <div className="d-flex align-items-center mb-1">
                            <i className="bi bi-currency-dollar me-2"></i>
                            <span className={mutedTextClass}>
                              Amount: <strong className={textClass}>${notification.data.amount}</strong>
                            </span>
                          </div>
                        )}
                        {notification.data.reason && (
                          <div className="d-flex align-items-center">
                            <i className="bi bi-chat-left-text me-2"></i>
                            <span className={mutedTextClass}>
                              Reason: <em className={textClass}>{notification.data.reason}</em>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className={`badge bg-${notification.status === "unread" ? "primary" : "secondary"} rounded-pill`}>
                        {notification.status}
                      </span>
                      
                      <div className="d-flex gap-2">
                        {notification.status === "unread" && (
                          <button
                            className={`btn btn-sm ${isDarkMode ? "btn-outline-light" : "btn-outline-success"}`}
                            onClick={() => markAsRead(notification.notification_id)}
                            title="Mark as read"
                          >
                            <i className="bi bi-check-lg"></i>
                            <span className="visually-hidden">Mark as read</span>
                          </button>
                        )}
                        <button
                          className={`btn btn-sm ${isDarkMode ? "btn-outline-light" : "btn-outline-danger"}`}
                          onClick={() => deleteNotification(notification.notification_id)}
                          title="Delete notification"
                        >
                          <i className="bi bi-trash"></i>
                          <span className="visually-hidden">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && !error && notifications.length > 0 && (
        <div className={`offcanvas-footer ${footerBgClass} border-top p-3`}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <span className={`badge bg-${unreadCount > 0 ? "warning" : "success"} me-2`}>
                {unreadCount}
              </span>
              <small className={mutedTextClass}>
                {unreadCount === 0 ? "All caught up" : `${unreadCount} unread`}
              </small>
            </div>
            <small className={mutedTextClass}>
              Total: {notifications.length}
            </small>
          </div>
          
          {/* Mobile action buttons */}
          <div className="d-flex d-sm-none gap-2 mt-2">
            <button
              className={`btn btn-sm ${isDarkMode ? "btn-outline-light" : "btn-outline-dark"} flex-fill`}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <i className="bi bi-check-all me-1"></i>
              Mark all
            </button>
            <button
              className="btn btn-sm btn-outline-danger flex-fill"
              onClick={clearAllNotifications}
            >
              <i className="bi bi-trash me-1"></i>
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;