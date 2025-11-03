import React, { useEffect, useState, useRef } from "react";
import "../../Assets/Styles/Style.css";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "datatables.net-responsive-dt";
import "datatables.net";
import { Modal, Button, Form, Breadcrumb, Spinner, Badge, Alert, Row, Col, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ButtonGlobal from "../../Components/Button";
import { useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";
import { getCookie } from "../../config/utils";

const Refund = () => {
  
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [formData, setFormData] = useState({
    cancellation_id: "",
    order_id: "",
    order_date: "",
    order_total: "",
    payment_method: "",
    reason: "",
    status: "",
    requested_at: "",
    items: [],
    admin_name: "",
    user_name: "",
    user_email: "",
  });

  const tableRef = useRef(null);
  const dataTableInstance = useRef(null);
  const navigate = useNavigate();

  // Format cancellation data for DataTable
  const formatCancellationData = (cancellations) => {
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


    return cancellations.map((cancel, index) => ({
      id: index + 1, // Auto-increment number starting from 1
      original_cancellation_id: cancel.cancellation_id, // Keep original ID for API calls
      order_id: cancel.order_id,
      order_date: new Date(cancel.order_date).toLocaleString(),
      order_total: `$${parseFloat(cancel.order_total).toFixed(2)}`,
      payment_method: cancel.payment_method,
      reason: cancel.reason,
      status: cancel.status,
       requested_at: formatDateToMMDDYYYY(cancel.requested_at), // Updated date format
      items_count: cancel.items.length,
      rawData: cancel,
    }));
  };

  // Fetch cancellations from API
  const fetchCancellations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setSuccessMessage(null);

      const token = getCookie('token');
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await api.get("/admin/orders/cancellations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API Response:", response.data);

      if (response.data.success) {
        const formattedData = formatCancellationData(response.data.data);
        setData(formattedData);
        setLastRefreshTime(new Date());
      } else {
        throw new Error(response.data.message || "Failed to fetch cancellations");
      }
    } catch (err) {
      console.error("Error fetching cancellations:", err);
      setError(err.message || "Failed to load cancellations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCancellations();
  }, []);

  useEffect(() => {
    // Destroy existing DataTable if it exists
    if (dataTableInstance.current) {
      dataTableInstance.current.destroy();
      dataTableInstance.current = null;
    }

    if (data.length > 0 && !loading) {
      const tableElement = $("#dataTable");
      
      // Clear any existing content
      tableElement.empty();
      
      dataTableInstance.current = tableElement.DataTable({
        data: data,
        destroy: true,
        columns: [
          { 
            title: "ID", 
            data: "id",
            className: "text-center"
          },
          { title: "Order ID", data: "order_id" },
          { title: "Order Total", data: "order_total" },
          {
            title: "Payment Method",
            data: "payment_method",
            render: function (data) {
              return data ? data.charAt(0).toUpperCase() + data.slice(1) : "N/A";
            },
          },
          { title: "Reason", data: "reason" },
          {
            title: "Status",
            data: "status",
            className: "text-center",
            
            render: function (data) {
              const statusMap = {
                pending: { variant: "warning", text: "Pending" },
                approved: { variant: "success", text: "Approved" },
                rejected: { variant: "danger", text: "Rejected" },
                processed: { variant: "info", text: "Processed" },
                refunded: { variant: "primary", text: "Refunded" },
              };
              const statusInfo = statusMap[data] || {
                variant: "secondary",
                text: data || "Unknown",
              };
              return `<span class="badge bg-${statusInfo.variant}">${statusInfo.text}</span>`;
            },
          },
          { title: "Requested At", data: "requested_at" },
          { 
            title: "Items", 
            data: "items_count",
            className: "text-center"
          },
          {
            title: "Action",
            data: null,
            className: "text-center",
            render: function (data) {
              return `
                <i class="bi bi-eye view-icon" data-id="${data.original_cancellation_id}" ></i>
              `;
            },
          },
        ],
        responsive: false,
        scrollX: true,
        order: [[0, "asc"]],
        createdRow: function (row, data) {
          $(row).attr("data-cancel-id", data.original_cancellation_id);
        },
      });

      // View details
      $("#dataTable tbody").on("click", ".view-icon", function () {
        const originalCancellationId = $(this).data("id");
        const cancel = data.find((item) => item.original_cancellation_id === originalCancellationId);
        if (cancel) {
          setSelectedId(originalCancellationId);
          setFormData(cancel.rawData);
          setShowModal(true);
        }
      });
    }

    return () => {
      if (dataTableInstance.current) {
        dataTableInstance.current.destroy();
        dataTableInstance.current = null;
      }
    };
  }, [data, loading]);

  const handleUpdateStatus = async (cancellationId, status) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Selected ID:", cancellationId);
      
      // Find the cancellation by the original cancellation ID
      const cancellation = data.find(item => item.original_cancellation_id === cancellationId);
      
      console.log("Cancellation found:", cancellation);
      
      if (!cancellation) {
        throw new Error("Cancellation not found");
      }

      // Use the original cancellation ID for the API call
      const originalCancellationId = cancellation.original_cancellation_id;
      
      console.log("Original cancellation ID:", originalCancellationId);

      // Prepare the request body
      const requestBody = {
        admin_notes: status === "approved" 
          ? "Approved and refund processed" 
          : "Cancellation rejected because the order is already shipped."
      };

      // Choose correct API endpoint
      const endpoint = `/admin/cancellations/${originalCancellationId}/${status === "approved" ? "approve" : "reject"}`;
      
      console.log("Endpoint:", endpoint);

      const response = await api.post(
        endpoint,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${getCookie("token")}`,
          },
        }
      );

      console.log("Update status response:", response.data);

      if (response.data.success) {
        setSuccessMessage(response.data.message || `Cancellation ${status} successfully`);
        
        // Refresh the data instead of navigating
        await fetchCancellations();
        setShowModal(false);
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating cancellation status:", err);
      setError(err.message || "Failed to update cancellation status");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRefund = async () => {
    try {
      setVerificationLoading(true);
      setError(null);
      
      // Assuming the refund ID is stored in formData.refund_id
      const refundId = formData.refund_id;
      
      if (!refundId) {
        throw new Error("Refund ID not found");
      }
      
      const response = await api.get(`/admin/refund-status/${refundId}`, {
        headers: {
          Authorization: `Bearer ${getCookie('token')}`,
        },
      });
      
      if (response.data.success) {
        setVerificationData(response.data.data || response.data);
        setShowVerificationModal(true);
        setShowModal(false);
      } else {
        throw new Error(response.data.message || "Failed to verify refund");
      }
    } catch (err) {
      console.error("Error verifying refund:", err);
      setError(err.message || "Failed to verify refund");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCancellations(true);
  };

  const breadcrumbItems = [
    { label: "Sales", href: "#", active: true },
    { label: "Refund", href: "#", active: true },
  ];

  return (
    <div className="px-3 w-100">
      <div className="d-flex justify-content-between align-items-center pt-3">
        <div>
          <h4 className="H4-heading fw-bold">Refund Requests</h4>
          <Breadcrumb className="m-0">
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item
                key={index}
                active={item.active}
                {...(!item.active && { href: item.href })}
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

      {error && (
        <Alert variant="danger" className="mt-3 d-flex align-items-center justify-content-between">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          />
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mt-3 d-flex align-items-center justify-content-between">
          <div>
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage(null)}
          />
        </Alert>
      )}

      <div className="card mt-4  p-3 rounded-3 shadow-sm">
        {loading && !dataTableInstance.current ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2 text-muted">Loading refund requests...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-4 text-muted"></i>
            <p className="mt-2 text-muted">No refund requests found</p>
          </div>
        ) : (
          <table
            id="dataTable"
            className="table table-striped table-hover custom-data-table"
            ref={tableRef}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Order ID</th>
                <th>Order Total</th>
                <th>Payment Method</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Items</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* DataTable will populate this automatically */}
            </tbody>
          </table>
        )}
      </div>

      {/* Refund Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0 ">
    <Modal.Title className="w-100 p-2">
  <h5 className="mb-1">Refund Request Details</h5>
</Modal.Title>

<div className="px-3 pb-2">
  <Badge
    bg={
      formData.status === "pending"
        ? "warning"
        : formData.status === "approved"
        ? "success"
        : formData.status === "rejected"
        ? "danger"
        : formData.status === "refunded"
        ? "primary"
        : "secondary"
    }
    className="px-2 py-1 text-capitalize d-inline-block"
    style={{ fontSize: "0.75rem" }}
  >
    {formData.status || "Unknown"}
  </Badge>
</div>


        </Modal.Header>
        <Modal.Body className="pt-0" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <Row className="mb-4">
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-transparent">
                  <h6 className="mb-0">Order Information</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <small className="text-muted">Order ID</small>
                    <p className="mb-0 fw-semibold">{formData.order_id}</p>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Order Date</small>
                    <p className="mb-0">{formData.order_date ? new Date(formData.order_date).toLocaleString() : "N/A"}</p>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Order Total</small>
                    <p className="mb-0 fw-bold text-primary">${formData.order_total ? parseFloat(formData.order_total).toFixed(2) : "0.00"}</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-transparent">
                  <h6 className="mb-0">Payment Details</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <small className="text-muted">Payment Method</small>
                    <p className="mb-0 text-capitalize">{formData.payment_method || "N/A"}</p>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Requested At</small>
                    <p className="mb-0">{formData.requested_at ? new Date(formData.requested_at).toLocaleString() : "N/A"}</p>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Reason</small>
                    <p className="mb-0">{formData.reason || "N/A"}</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h6 className="mb-0">Order Items</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive custom-data-table">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Image</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items && formData.items.length > 0 ? (
                      formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="align-middle">{item.product_name || "N/A"}</td>
                          <td className="align-middle">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.product_name || "Product"}
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                  borderRadius: "4px"
                                }}
                              />
                            ) : (
                              <div style={{
                                width: "50px",
                                height: "50px",
                                backgroundColor: "#f8f9fa",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}>
                                <i className="bi bi-image text-muted"></i>
                              </div>
                            )}
                          </td>
                          <td className="align-middle">${item.price ? parseFloat(item.price).toFixed(2) : "0.00"}</td>
                          <td className="align-middle">{item.quantity || "0"}</td>
                          <td className="align-middle fw-semibold">${item.total ? parseFloat(item.total).toFixed(2) : "0.00"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-3 text-muted">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {formData.status === "pending" && (
            <div className="d-flex gap-2">
              <Button
                type="button"
                variant="outline-danger"
                onClick={() => handleUpdateStatus(selectedId, "rejected")}
                disabled={loading}
              >
                {loading ? "Processing..." : "Reject Request"}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleUpdateStatus(selectedId, "approved")}
                disabled={loading}
              >
                {loading ? "Processing..." : "Approve Refund"}
              </Button>
            </div>
          )}
          {formData.status === "refunded" && (
            <Button
              variant="outline-primary"
              onClick={handleVerifyRefund}
              disabled={verificationLoading}
            >
              {verificationLoading ? "Verifying..." : "Verify Refund"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Verification Result Modal */}
      <Modal show={showVerificationModal} onHide={() => setShowVerificationModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title>Refund Verification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {verificationData ? (
            <>
              <Alert variant={verificationData.status === "succeeded" ? "success" : "danger"} className="border-0">
                <div className="d-flex">
                  <div className="flex-grow-1">
                    <Alert.Heading className="d-flex align-items-center">
                      <i className={`bi bi-${verificationData.status === "succeeded" ? "check-circle-fill" : "x-circle-fill"} me-2`}></i>
                      Refund {verificationData.status === "succeeded" ? "Successful" : "Failed"}
                    </Alert.Heading>
                    <hr />
                    <Row>
                      <Col md={6}>
                        <p className="mb-1">
                          <strong>Refund ID:</strong>
                        </p>
                        <p className="text-muted">{verificationData.refund_id || "N/A"}</p>
                      </Col>
                      <Col md={6}>
                        <p className="mb-1">
                          <strong>Amount:</strong>
                        </p>
                        <p className="text-muted">{verificationData.amount || "0"} {verificationData.currency || "AUD"}</p>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <p className="mb-1">
                          <strong>Status:</strong>
                        </p>
                        <Badge
                          bg={
                            verificationData.status === "succeeded"
                              ? "success"
                              : "danger"
                          }
                          className="px-2 py-1"
                        >
                          {verificationData.status || "unknown"}
                        </Badge>
                      </Col>
                      <Col md={6}>
                        <p className="mb-1">
                          <strong>Processed At:</strong>
                        </p>
                        <p className="text-muted">
                          {verificationData.created_at ? new Date(verificationData.created_at).toLocaleString() : "N/A"}
                        </p>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Alert>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-transparent py-2">
                  <h6 className="mb-0">Transaction Details</h6>
                </Card.Header>
                <Card.Body className="py-3">
                  <Row>
                    <Col md={6}>
                      <p className="mb-1">
                        <strong>Charge ID:</strong>
                      </p>
                      <p className=" small">{verificationData.charge || "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1">
                        <strong>Payment Intent:</strong>
                      </p>
                      <p className=" small">{verificationData.payment_intent || "N/A"}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading verification details...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="outline-secondary" onClick={() => setShowVerificationModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Refund;