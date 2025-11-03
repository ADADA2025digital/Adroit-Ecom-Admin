import React, { useEffect, useState } from "react";
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
  Badge,
  Card,
  OverlayTrigger,
  Tooltip,
  Alert,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ButtonGlobal from "../../Components/Button";
import { useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";
import { getCookie } from "../../config/utils";

const Transaction = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    payment_id: "",
    order_id: "",
    invoice_number: "",
    payment_method: "",
    payment_status: "",
    total_price: "",
    paid_amount: "",
    updated_at: "",
    payment_date: "",
    order: {
      orderstatus: "",
      payment_status: "",
      total_price: "",
      updated_at: "",
    },
    user: {
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
    },
  });

  const navigate = useNavigate();

  // Format payment data for DataTable
  const formatPaymentData = (payments) => {
    const formatDateToMMDDYYYY = (dateString) => {
      if (!dateString) return "";

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${month}/${day}/${year}`;
    };

    return payments.map((payment, index) => ({
      index: index + 1,
      id: payment.id,
      payment_id: payment.payment_id,
      order_id: payment.order_id,
      invoice_number: payment.invoice_number,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      total_price: `$${parseFloat(payment.total_price).toFixed(2)}`,
      paid_amount: `$${parseFloat(payment.paid_amount).toFixed(2)}`,
      updated_at: formatDateToMMDDYYYY(payment.updated_at),
      payment_date: formatDateToMMDDYYYY(payment.payment_date),
      order_status: payment.order.orderstatus,
      user_name: `${payment.user.firstname} ${payment.user.lastname}`,
      rawData: payment,
    }));
  };

  // Apply filters to data
  const applyFilters = (dataToFilter) => {
    let filtered = dataToFilter;

    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.payment_status === paymentStatusFilter
      );
    }

    if (orderStatusFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.order_status === orderStatusFilter
      );
    }

    return filtered;
  };

  // Fetch payments from API
  const fetchPayments = async (isRefresh = false) => {
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

      const response = await api.get("/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const formattedData = formatPaymentData(response.data.data);
        setData(formattedData);
        setFilteredData(applyFilters(formattedData));
        setLastRefreshTime(new Date());
      } else {
        throw new Error(response.data.message || "Failed to fetch payments");
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load payments"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Update filtered data when filters change
  useEffect(() => {
    setFilteredData(applyFilters(data));
  }, [paymentStatusFilter, orderStatusFilter, data]);

  // Print function
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    // Get unique status values for filter display
    const paymentStatusValues = [
      ...new Set(data.map((item) => item.payment_status)),
    ];
    const orderStatusValues = [
      ...new Set(data.map((item) => item.order_status)),
    ];

    // Create printable HTML with proper numbering for filtered data
    const printableContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Transaction Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 20px; }
          .filters { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
          .filter-item { margin-right: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .badge { padding: 3px 8px; border-radius: 4px; color: white; font-size: 12px; }
          .bg-success { background-color: #198754; }
          .bg-warning { background-color: #ffc107; }
          .bg-primary { background-color: #0d6efd; }
          .bg-danger { background-color: #dc3545; }
          .bg-secondary { background-color: #6c757d; }
          .text-center { text-align: center; }
          .report-date { text-align: right; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>Transaction Report</h1>
        <div class="report-date">Generated: ${new Date().toLocaleString()}</div>
        
        <div class="filters">
          <strong>Applied Filters:</strong>
          <span class="filter-item">Payment Status: ${
            paymentStatusFilter === "all" ? "All" : paymentStatusFilter
          }</span>
          <span class="filter-item">Order Status: ${
            orderStatusFilter === "all" ? "All" : orderStatusFilter
          }</span>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Order ID</th>
              <th>Invoice ID</th>
              <th>Payment Method</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th>Total Amount</th>
              <th>Paid Amount</th>
              <th>Customer</th>
              <th>Payment Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData
              .map(
                (item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td class="text-center">${item.order_id}</td>
                <td>${item.invoice_number}</td>
                <td>${
                  item.payment_method.charAt(0).toUpperCase() +
                  item.payment_method.slice(1)
                }</td>
                <td class="text-center">
                  <span class="badge ${
                    item.payment_status === "paid"
                      ? "bg-success"
                      : item.payment_status === "pending"
                      ? "bg-warning"
                      : item.payment_status === "refunded"
                      ? "bg-primary"
                      : "bg-secondary"
                  }">${item.payment_status}</span>
                </td>
                <td class="text-center">
                  <span class="badge ${
                    item.order_status === "processing"
                      ? "bg-warning"
                      : item.order_status === "shipped"
                      ? "bg-success"
                      : item.order_status === "cancelled"
                      ? "bg-danger"
                      : "bg-secondary"
                  }">${item.order_status}</span>
                </td>
                <td>${item.total_price}</td>
                <td>${item.paid_amount}</td>
                <td>${item.user_name}</td>
                <td>${item.payment_date}</td>
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

  useEffect(() => {
    if (filteredData.length > 0 && !loading) {
      const table = $("#dataTable").DataTable({
        data: filteredData,
        destroy: true,
        columns: [
          {
            title: "ID",
            data: "index",
            className: "text-center",
          },
          { title: "Order ID", data: "order_id" },
          { title: "Invoice ID", data: "invoice_number" },
          {
            title: "Payment Method",
            data: "payment_method",
            render: function (data) {
              return data.charAt(0).toUpperCase() + data.slice(1);
            },
          },
          {
            title: "Payment Status",
            data: "payment_status",
            className: "text-center",
            render: function (data) {
              const statusMap = {
                paid: { variant: "success", text: "Paid" },
                pending: { variant: "warning", text: "Pending" },
                refunded: { variant: "primary", text: "Refunded" },
                unpaid: { variant: "secondary", text: "Unpaid" },
              };
              const statusInfo = statusMap[data] || {
                variant: "info",
                text: data,
              };
              return `<span class="badge bg-${statusInfo.variant}">${statusInfo.text}</span>`;
            },
          },
          {
            title: "Order Status",
            data: "order_status",
            className: "text-center",
            render: function (data) {
              const statusMap = {
                processing: { variant: "warning", text: "Processing" },
                shipped: { variant: "success", text: "Shipped" },
                cancelled: { variant: "danger", text: "Cancelled" },
              };
              const statusInfo = statusMap[data] || {
                variant: "secondary",
                text: data,
              };
              return `<span class="badge bg-${statusInfo.variant}">${statusInfo.text}</span>`;
            },
          },
          { title: "Total Amount", data: "total_price" },
          { title: "Paid Amount", data: "paid_amount" },
          { title: "Customer", data: "user_name" },
          { title: "Payment Date", data: "payment_date" },
          {
            title: "Action",
            data: null,
            className: "text-center",
            render: function (data) {
              return `
                <i class="bi bi-eye view-icon" data-id="${data.id}" ></i>
              `;
            },
          },
        ],
        responsive: false,
        scrollX: true,
        order: [[0, "asc"]],
        createdRow: function (row, data) {
          $(row).attr("data-payment-id", data.id);
        },
      });

      // View details
      $("#dataTable tbody").on("click", ".view-icon", function () {
        const id = $(this).data("id");
        const payment = data.find((item) => item.id === id);
        setSelectedPayment(id);
        setFormData(payment.rawData);
        setShowModal(true);
      });

      return () => {
        table.destroy();
      };
    }
  }, [filteredData, loading, data]);

  const handleRefresh = () => {
    fetchPayments(true);
  };

  // Get unique status values for filter dropdowns
  const paymentStatusOptions = [
    "all",
    ...new Set(data.map((item) => item.payment_status)),
  ];
  const orderStatusOptions = [
    "all",
    ...new Set(data.map((item) => item.order_status)),
  ];

  const breadcrumbItems = [
    { label: "Sales", href: "#", active: true },
    { label: "Transaction", href: "#", active: true },
  ];

  // Helper function to format order status
  const formatOrderStatus = (status) => {
    const statusMap = {
      processing: { variant: "warning", text: "Processing" },
      shipped: { variant: "success", text: "Shipped" },
      cancelled: { variant: "danger", text: "Cancelled" },
    };
    return statusMap[status] || { variant: "secondary", text: status };
  };

  // Helper function to format payment status
  const formatPaymentStatus = (status) => {
    const statusMap = {
      paid: { variant: "success", text: "Paid" },
      pending: { variant: "warning", text: "Pending" },
      refunded: { variant: "primary", text: "Refunded" },
    };
    return statusMap[status] || { variant: "secondary", text: status };
  };

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
          <Alert.Heading>Error Loading Transactions</Alert.Heading>
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
          <h4 className="H4-heading fw-bold">Payment List</h4>
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

      {/* Filters Section */}
      <div className="bg-transparent shadow-sm mb-4">
        <div className="card-body">
          <div className="row">
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
            <div className="col-md-2 mb-2">
              <Form.Label>Order Status</Form.Label>
              <Form.Select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                {orderStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All Order Statuses" : option}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-6 d-flex align-items-end mb-2">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setPaymentStatusFilter("all");
                  setOrderStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
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

      {/* Enhanced Modal for Payment Details */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton className=" sticky-to bg-transparent">
          <Modal.Title className="fw-bold ">
            <p> Payment Details</p>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="p-4"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          {/* Payment Information Card */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="  fw-semibold bg-transparent">
              <i className="bi bi-credit-card me-2"></i>
              Payment Information
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex flex-column mb-3">
                    <small className="text-muted mb-1">Payment ID</small>
                    <span className="fw-semibold">{formData.payment_id}</span>
                  </div>
                  <div className="d-flex flex-column mb-3">
                    <small className="text-muted mb-1">Order ID</small>
                    <span className="fw-semibold">{formData.order_id}</span>
                  </div>
                  <div className="d-flex flex-column mb-3">
                    <small className="text-muted mb-1">Payment Method</small>
                    <span className="fw-semibold text-capitalize">
                      {formData.payment_method}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex flex-column mb-3">
                    <small className="text-muted mb-1">Total Amount</small>
                    <span className="fw-semibold text-success">
                      ${parseFloat(formData.total_price).toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex flex-column mb-3">
                    <small className="text-muted mb-1">Paid Amount</small>
                    <span className="fw-semibold text-success">
                      ${parseFloat(formData.paid_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex flex-column mb-3">
                    <small className="text-muted mb-1">Payment Status</small>
                    <Badge
                      bg={formatPaymentStatus(formData.payment_status).variant}
                      className="align-self-start"
                    >
                      {formatPaymentStatus(formData.payment_status).text}
                    </Badge>
                  </div>
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex flex-column">
                    <small className="text-muted mb-1">Created At</small>
                    <span>
                      {new Date(formData.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex flex-column">
                    <small className="text-muted mb-1">Payment Date</small>
                    <span>
                      {new Date(formData.payment_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Order Information Card */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-transparent  fw-semibold">
              <i className="bi bi-box me-2"></i>
              Order Information
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex flex-column mb-3">
                    <small className="text-muted mb-1">Order Status</small>
                    <Badge
                      bg={formatOrderStatus(formData.order.orderstatus).variant}
                      className="align-self-start"
                    >
                      {formatOrderStatus(formData.order.orderstatus).text}
                    </Badge>
                  </div>
                  <div className="d-flex flex-column">
                    <small className="text-muted mb-1">Order Total</small>
                    <span className="fw-semibold">
                      ${parseFloat(formData.order.total_price).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex flex-column mb-3">
                    <small className="text-muted mb-1">Last Updated</small>
                    <span>
                      {new Date(formData.order.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="d-flex flex-column">
                    <small className="text-muted mb-1">Payment Status</small>
                    <Badge
                      bg={
                        formData.order.payment_status === "paid"
                          ? "success"
                          : "danger"
                      }
                      className="align-self-start"
                    >
                      {formData.order.payment_status.charAt(0).toUpperCase() +
                        formData.order.payment_status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Customer Information Card */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent fw-semibold">
              <i className="bi bi-person me-2 "></i>
              Customer Information
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex flex-column mb-3">
                    <small className="text-muted mb-1">Customer Name</small>
                    <span className="fw-semibold">{`${formData.user.firstname} ${formData.user.lastname}`}</span>
                  </div>
                  <div className="d-flex flex-column">
                    <small className="text-muted mb-1">Email</small>
                    <span>{formData.user.email}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex flex-column">
                    <small className="text-muted mb-1">Phone</small>
                    <span>{formData.user.phone}</span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer className="bg-transparent sticky-bottom">
          <ButtonGlobal
            onClick={() => setShowModal(false)}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
          >
            Close
          </ButtonGlobal>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Transaction;
