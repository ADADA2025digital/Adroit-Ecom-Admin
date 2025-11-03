import React, { useEffect, useState } from "react";
import "../../Assets/Styles/Style.css";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import 'datatables.net-responsive-dt';
import "datatables.net";
import { Breadcrumb, Spinner, Alert, OverlayTrigger, Tooltip, Figure } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ButtonGlobal from "../../Components/Button";
import { useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";
import { getCookie } from "../../config/utils";

const UserList = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Added refreshing state
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch users from API
  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const token = getCookie('token');
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await api.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Date formatting function
    const formatDateToMMDDYYYY = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month} ${day} ${year}`;
    };

      // Add index to each user for the auto-increment column
      const formattedUsers = response.data.map((user, index) => ({
        index: index + 1, // Auto-increment number starting from 1
        id: user.id,
        user_id: user.user_id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        // role_name: user.role_name,
        created_at: formatDateToMMDDYYYY(user.created_at), // Updated date format
      }));

      setUsers(formattedUsers);
      setLastRefreshTime(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch users");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!loading && users.length > 0) {
      // Initialize DataTable
      const table = $("#dataTable").DataTable({
        data: users,
        destroy: true,
        columns: [
          { 
            title: "ID", 
            data: "index",
            className: "text-center"
          },
          { 
            title: "First Name", 
            data: "firstname" 
          },
          { 
            title: "Last Name", 
            data: "lastname" 
          },
          { 
            title: "Email", 
            data: "email" 
          },
          { 
            title: "Phone", 
            data: "phone" 
          },
        //   { 
        //   title: "Role", 
        //   data: "role_id",
        //   render: function(data, type, row) {
     
        //     const roleMap = {
        //       1: "Admin",
        //       2: "User",
        //       3: "Seller"
        //     };
            
       
        //     return roleMap[data] || data || "N/A";
        //   }
        // },
          { 
            title: "Created At", 
            data: "created_at" 
          }
        ],
        responsive:false,
        scrollX: true,
        language: {
          emptyTable: "No users found"
        },
        order: [[0, 'asc']] 
      });

      return () => {
        table.destroy();
      };
    }
  }, [users, loading, navigate]);

  const breadcrumbItems = [
    { label: "Users", link: "/dashboard", active: true },
    { label: "UserList", link: "/users", active: true },
  ];

  const handleRefresh = () => {
    fetchUsers(true); // Pass true to indicate it's a refresh operation
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Users</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end mt-3">
            <ButtonGlobal onClick={handleRefresh} text="Retry" />
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">
            User List
          </h4>
          <Breadcrumb>
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item
                key={index}
                active={item.active}
                href={!item.active ? item.link : undefined}
              >
                {item.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>

        <div className="d-flex align-items-center gap-3">
          {lastRefreshTime && (
             <p className="pt-3">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </p>
          )}
           <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={handleRefresh}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            disabled={refreshing}
            style={{
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            <i
              className={`bi bi-arrow-clockwise ${refreshing ? "spin" : ""}`}
            />
          </ButtonGlobal>
        </div>
        </div>
      </div>

      
 {/* <div className="table-responsive ">
        <table id="dataTable" className="display table table-striped custom-data-table"></table>
      </div>
 */}

          <div className=" card mt-1 p-3 rounded-3 shadow">
            <table
              id="dataTable"
              className="table table-striped table-hover   custom-data-table"
           
            ></table>
          </div>

       
        
    </div>
  );
};

export default UserList;