import React, { useEffect, useState, useRef } from "react";
import "../../Assets/Styles/Style.css";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "datatables.net-responsive-dt";
import "datatables.net";
import {
  Modal,
  Button,
  Form,
  Breadcrumb,
  Spinner,
  Alert,
  OverlayTrigger,
  Tooltip,
  Dropdown,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ButtonGlobal from "../../Components/Button";
import { useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";
import { getCookie } from "../../config/utils";

const OrderList = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
  });
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    office: "",
    age: "",
    startDate: "",
    salary: "",
  });

  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  const navigate = useNavigate();

  // Date formatting function
  const formatDateToMMDDYYYY = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  // Format order data for DataTable
  const formatOrderData = (orders) => {
    return orders.map((order, index) => ({
      id: order.order_id,
      index: index + 1, // Auto-increment number starting from 1
      orderId: order.order_id,
      customerName: order.customer.name,
      totalAmount: `$${parseFloat(order.total_amount).toFixed(2)}`,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      date: formatDateToMMDDYYYY(order.date), // Updated date format
      itemsCount: order.items.length,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      rawData: order, // Keep original data for details view
    }));
  };

  // Apply filters to data
  const applyFilters = (dataToFilter) => {
    let filtered = dataToFilter;

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.paymentStatus === paymentStatusFilter
      );
    }

    return filtered;
  };

  // Fetch ALL orders from API with pagination
  const fetchAllOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const token = getCookie("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      let allOrders = [];
      let currentPage = 1;
      let totalPages = 1;

      // First, get the first page to understand pagination
      const firstResponse = await api.get("/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
        },
      });

      if (firstResponse.data.success) {
        // Get pagination info from response
        const pagination = firstResponse.data.pagination;
        setPaginationInfo({
          total: pagination.total,
          currentPage: pagination.current_page,
          lastPage: pagination.last_page,
          perPage: pagination.per_page,
        });

        // Add first page orders
        allOrders = [...allOrders, ...firstResponse.data.orders];

        // If there are more pages, fetch them all
        totalPages = pagination.last_page;

        // Create an array of promises for all remaining pages
        const pagePromises = [];
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(
            api.get("/admin/orders", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                page: page,
              },
            })
          );
        }

        // Fetch all remaining pages concurrently
        if (pagePromises.length > 0) {
          const responses = await Promise.all(pagePromises);
          responses.forEach((response) => {
            if (response.data.success) {
              allOrders = [...allOrders, ...response.data.orders];
            }
          });
        }

        const formattedData = formatOrderData(allOrders);
        setData(formattedData);
        setFilteredData(applyFilters(formattedData));
        setLastRefreshTime(new Date());
      } else {
        throw new Error("Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize DataTable
  const initializeDataTable = (tableData) => {
    if (dataTableRef.current) {
      dataTableRef.current.destroy();
      dataTableRef.current = null;
    }

    const table = $("#dataTable").DataTable({
      data: tableData,
      destroy: true,
      columns: [
        {
          title: "ID",
          data: "index",
          className: "text-center",
          width: "50px",
        },
        {
          title: "Order ID",
          data: "orderId",
          className: "text-center",
          width: "150px",
        },
        { title: "Customer", data: "customerName", width: "200px" },
        { title: "Total Amount", data: "totalAmount", width: "150px" },
        {
          title: "Status",
          data: "status",
          className: "text-center",
          width: "150px",
          render: function (data, type, row) {
            let badgeClass = "";
            switch (data) {
              case "processing":
                badgeClass = "bg-warning";
                break;
              case "shipped":
                badgeClass = "bg-success";
                break;
              case "cancelled":
                badgeClass = "bg-danger";
                break;
              default:
                badgeClass = "bg-secondary";
            }
            return `<span class="badge ${badgeClass}">${data}</span>`;
          },
        },
        {
          title: "Payment Status",
          data: "paymentStatus",
          className: "text-center",
          width: "150px",
          render: function (data, type, row) {
            let badgeClass = "";
            let displayText = data;

            // Handle payment status styling
            if (data.toLowerCase() === "paid") {
              badgeClass = "bg-success";
            } else if (data.toLowerCase() === "pending") {
              badgeClass = "bg-warning";
            } else if (
              data.toLowerCase() === "failed" ||
              data.toLowerCase() === "cancelled"
            ) {
              badgeClass = "bg-danger";
            } else {
              badgeClass = "bg-secondary";
            }

            return `<span class="badge ${badgeClass}">${displayText}</span>`;
          },
        },
        { title: "Date", data: "date", width: "150px" },
        {
          title: "Action",
          className: "text-center",
          width: "50px",
          data: null,
          render: function (data, type, row) {
            return `
              <i class="bi bi-eye view-icon" data-id="${row.id}" "></i>
            `;
          },
        },
      ],
      responsive: false,
      scrollX: true,
      createdRow: function (row, data, dataIndex) {
        // Add data attributes for easier access to the full data
        $(row).attr("data-order-id", data.id);
      },
    });

    dataTableRef.current = table;

    // View — navigate to details page
    $("#dataTable tbody").on("click", ".view-icon", function () {
      const id = $(this).data("id");
      const order = tableData.find((item) => item.id === id);
      navigate(`/orderdetails/${id}`);
    });
  };

  // Update DataTable with new data while preserving state
  const updateDataTable = (newData) => {
    if (dataTableRef.current) {
      // Get current search term, page, and other state
      const searchTerm = dataTableRef.current.search();
      const currentPage = dataTableRef.current.page();
      const pageInfo = dataTableRef.current.page.info();

      // Clear and redraw with new data
      dataTableRef.current.clear();
      dataTableRef.current.rows.add(newData);
      dataTableRef.current.draw();

      // Restore search term if it exists
      if (searchTerm) {
        dataTableRef.current.search(searchTerm).draw();
      }

      // Try to restore page position if possible
      if (currentPage >= 0 && currentPage < pageInfo.pages) {
        dataTableRef.current.page(currentPage).draw("page");
      }
    }
  };

  // Setup live updates (WebSocket or polling)
  const setupLiveUpdates = () => {
    // Option 2: Polling implementation (every 30 seconds)
    const pollInterval = setInterval(() => {
      fetchAllOrders(true);
    }, 5000);

    return () => clearInterval(pollInterval);
  };

  // Handle individual order updates
  const handleOrderUpdate = (updatedOrder) => {
    setData((prevData) => {
      const updatedData = prevData.map((item) =>
        item.id === updatedOrder.id ? { ...item, ...updatedOrder } : item
      );

      // Update filtered data
      const newFilteredData = applyFilters(updatedData);
      setFilteredData(newFilteredData);

      // Update DataTable without resetting search/filters
      if (dataTableRef.current) {
        updateDataTable(newFilteredData);
      }

      return updatedData;
    });
  };

  useEffect(() => {
    fetchAllOrders();

    // Setup live updates
    const cleanup = setupLiveUpdates();

    return () => {
      cleanup();
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }
    };
  }, []);

  // Initialize DataTable when filteredData changes
  useEffect(() => {
    if (filteredData.length > 0 && !loading && !dataTableRef.current) {
      initializeDataTable(filteredData);
    }
  }, [filteredData, loading]);

  // Update DataTable when filteredData changes (for filter updates)
  useEffect(() => {
    if (dataTableRef.current && filteredData.length > 0) {
      updateDataTable(filteredData);
    }
  }, [filteredData]);

  // Update filtered data when filters change
  useEffect(() => {
    const newFilteredData = applyFilters(data);
    setFilteredData(newFilteredData);
  }, [statusFilter, paymentStatusFilter, data]);

  // Print function
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    // Get unique status and payment status values for filter display
    const statusValues = [...new Set(data.map((item) => item.status))];
    const paymentStatusValues = [
      ...new Set(data.map((item) => item.paymentStatus)),
    ];

    // Create printable HTML with proper numbering for filtered data
    const printableContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order List Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .filters { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .filter-item { margin-right: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .badge { padding: 3px 8px; border-radius: 4px; color: white; font-size: 12px; }
            .bg-warning { background-color: #ffc107; }
            .bg-success { background-color: #198754; }
            .bg-danger { background-color: #dc3545; }
            .bg-secondary { background-color: #6c757d; }
            .text-center { text-align: center; }
            .report-date { text-align: right; margin-bottom: 10px; }
            .summary { margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Order List Report</h1>
          <div class="report-date">Generated: ${new Date().toLocaleString()}</div>
          
          <div class="summary">
            <strong>Summary:</strong> 
            Showing ${filteredData.length} of ${data.length} total orders
            ${
              paginationInfo.total > 0
                ? `(Total in database: ${paginationInfo.total})`
                : ""
            }
          </div>
          
          <div class="filters">
            <strong>Applied Filters:</strong>
            <span class="filter-item">Status: ${
              statusFilter === "all" ? "All" : statusFilter
            }</span>
            <span class="filter-item">Payment Status: ${
              paymentStatusFilter === "all" ? "All" : paymentStatusFilter
            }</span>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Payment Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                .map(
                  (item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td class="text-center">${item.orderId}</td>
                  <td>${item.customerName}</td>
                  <td>${item.totalAmount}</td>
                  <td class="text-center">
                    <span class="badge ${
                      item.status === "processing"
                        ? "bg-warning"
                        : item.status === "shipped"
                        ? "bg-success"
                        : item.status === "cancelled"
                        ? "bg-danger"
                        : "bg-secondary"
                    }">${item.status}</span>
                  </td>
                  <td class="text-center">
                    <span class="badge ${
                      item.paymentStatus.toLowerCase() === "paid"
                        ? "bg-success"
                        : item.paymentStatus.toLowerCase() === "pending"
                        ? "bg-warning"
                        : item.paymentStatus.toLowerCase() === "failed" ||
                          item.paymentStatus.toLowerCase() === "cancelled"
                        ? "bg-danger"
                        : "bg-secondary"
                    }">${item.paymentStatus}</span>
                  </td>
                  <td>${item.date}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printableContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = function () {
      printWindow.print();
      // printWindow.close(); // Uncomment to automatically close after printing
    };
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/orders/${selectedId}`);
      setData((prevData) => prevData.filter((item) => item.id !== selectedId));
      setShowModal(false);
    } catch (err) {
      console.error("Error deleting order:", err);
      setError("Failed to delete order");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRefresh = () => {
    fetchAllOrders(true); // Pass true to indicate it's a refresh operation
  };

  // Get unique status and payment status values for filter dropdowns
  const statusOptions = ["all", ...new Set(data.map((item) => item.status))];
  const paymentStatusOptions = [
    "all",
    ...new Set(data.map((item) => item.paymentStatus)),
  ];

  const breadcrumbItems = [
    { label: "Orders", link: "/product", href: "#", active: true },
    { label: "Orderlist", link: "/category", href: "/category", active: true },
  ];

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
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
          <Alert.Heading>Error Loading Orders</Alert.Heading>
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
          <h4 className="H4-heading fw-bold">OrderList</h4>
          <Breadcrumb>
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item
                key={index}
                href={!item.active ? item.link : undefined}
                active={item.active}
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
            <ButtonGlobal
              onClick={handlePrint}
              className="btn btn-outline-primary d-flex align-items-center justify-content-center"
              text="Print"
            >
              <i className="bi bi-printer me-1" />
              Print
            </ButtonGlobal>
          </div>
        </div>
      </div>

      {/* Summary Info */}
      {/* {paginationInfo.total > 0 && (
        <div className="alert alert-info mb-4">
          <strong>Database Summary:</strong> {paginationInfo.total} total orders | 
          <strong> Loaded:</strong> {data.length} orders | 
          <strong> Filtered:</strong> {filteredData.length} orders
        </div>
      )} */}

      {/* Filters Section */}
      <div className=" bg-transparent shadow-sm mb-4">
        <div className="row">
          <div className="col-md-2 mb-2">
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All Statuses" : option}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-2 mb-2">
            <Form.Label>Payment Status</Form.Label>
            <Form.Select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              {paymentStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All Payment Statuses" : option}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-6 d-flex align-items-end mb-2">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setStatusFilter("all");
                setPaymentStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive mt-1 p-3 rounded-3 shadow">
            <table
              id="dataTable"
              className="table table-striped table-hover custom-data-table"
            ></table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
