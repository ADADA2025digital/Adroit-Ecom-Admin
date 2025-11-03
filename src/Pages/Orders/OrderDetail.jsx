import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Table,
  Badge,
  Spinner,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import api from "../../config/axiosConfig";
import { BiArrowBack } from "react-icons/bi";
import { Breadcrumb } from "react-bootstrap";

const OrderDetails = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();

  // State management
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Status update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [trackingStatus, setTrackingStatus] = useState("");


const fetchInvoice = async (orderId) => {
  try {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const orderExists = await checkOrderExists(orderId);
    if (!orderExists) {
      setError(`Order ${orderId} not found or you don't have permission to access it.`);
      return;
    }

    console.log("Fetching invoice for order:", orderId);
    let response = await api.get(`/invoice/${orderId}`);

    if (response.data.success) {
      navigate(`/invoice/${orderId}`, { 
        state: { 
          invoice: response.data.data,
          order: response.data.data
        } 
      });
    } else {
      throw new Error(response.data.message || "Failed to fetch invoice");
    }
  } catch (err) {
    console.error("Error fetching invoice:", err);
    
    if (err.response?.status === 404) {
      // Attempt to generate the invoice
      try {
        const generateResponse = await api.post(`/invoice/generate/${orderId}`);
        if (generateResponse.data.success) {
          navigate(`/invoice/${orderId}`, { 
            state: { 
              invoice: generateResponse.data.data,
              order: generateResponse.data.data
            } 
          });
        } else {
          setError(`Failed to generate invoice for order ${orderId}. Please contact support.`);
        }
      } catch (generateErr) {
        setError(`Invoice not found and could not be generated for order ${orderId}. Please contact support.`);
      }
    } else {
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to generate invoice. Please try again."
      );
    }
  } finally {
    setLoading(false);
  }
};


const checkOrderExists = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}/summary`);
    return response.data.success;
  } catch (err) {
    console.error("Error checking order:", err);
    return false;
  }
};

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/orders/${orderId}/summary`);

      if (response.data.success) {
        setOrder(response.data.order_summary);
        setStatusUpdate(response.data.order_summary.order_status);
        setTrackingStatus(response.data.order_summary.tracking_status || "");
      } else {
        setError("Failed to fetch order details");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch order details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const response = await api.put(`/orders/${orderId}/update`, {
        orderstatus: statusUpdate,
        track_status: trackingStatus || statusUpdate, // Use statusUpdate as fallback
      });

      if (response.data.success) {
        // Update the local state immediately with the response data
        setOrder((prevOrder) => ({
          ...prevOrder,
          order_status: statusUpdate,
          tracking_status: trackingStatus || statusUpdate,
          updated_at: new Date().toISOString(),
        }));

        setShowUpdateModal(false);
        setSuccess("Order status updated successfully");
      } else {
        throw new Error(
          response.data.message || "Failed to update order status"
        );
      }
    } catch (err) {
      console.error("Error updating order status:", err);

      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(", ");
        setError(`Validation errors: ${errorMessages}`);
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to update order status"
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  // Format date without external dependencies
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  // Get badge color based on status
  const getStatusBadge = (status) => {
    const statusMap = {
      processing: "warning",
      shipped: "success",

      cancelled: "danger",
    };
    return statusMap[status?.toLowerCase()] || statusMap.default;
  };

  // Loading state
  if (loading) {
    return (
      <div className="container py-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !order) {
    return (
      <div className="container py-4">
        <Alert variant="danger">
          {error.includes("404") ? "Order not found" : error}
          <div className="mt-2">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              Go back to Orders
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // No order data state
  if (!order) {
    return (
      <div className="container py-4">
        <Alert variant="warning">
          No order data available
          <div className="mt-2">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              Go back to Orders
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Order", href: "#", active: true },
    { label: "Order List", href: "/orders", active: true },
    { label: order.order_id, href: "#", active: true },
  ];

  return (
    <div className="container py-4">
      {/* Success message */}
      {success && (
        <Alert
          variant="success"
          onClose={() => setSuccess(null)}
          dismissible
          className="mb-4"
        >
          {success}
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Order Details</h4>
          <Breadcrumb className="m-0">
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item
                key={index}
                href={!item.active ? item.href : undefined}
                active={item.active}
              >
                {item.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
        <Button
          variant="outline-primary"
          onClick={() => navigate(-1)}
          className="btn-outline-secondary"
        >
          <BiArrowBack className="me-2" /> Back to List
        </Button>
      </div>

      <div className="row">
        {/* Order Summary */}
        <div className="col-md-6 mb-4">
          <Card>
            <Card.Header className="bg-transparent">
              <h5>Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <Table  className=" custom-data-table">
                <tbody>
                  <tr>
                    <td>
                      <strong>Order ID</strong>
                    </td>
                    <td>{order.order_id}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Order Date</strong>
                    </td>
                    <td>{formatDate(order.order_date)}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Status</strong>
                    </td>
                    <td>
                      <Badge
                        bg={getStatusBadge(order.order_status)}
                        className="text-capitalize"
                      >
                        {order.order_status}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Payment Status</strong>
                    </td>
                    <td>
                      <Badge
                        bg={
                          order.payment_status === "paid" ? "success" : "danger"
                        }
                      >
                        {order.payment_status}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Payment Method</strong>
                    </td>
                    <td className="text-capitalize">{order.payment_method}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Total Amount</strong>
                    </td>
                    <td>${parseFloat(order.total_amount).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Tracking Status</strong>
                    </td>
                    <td>{order.tracking_status || "N/A"}</td>
                  </tr>
                  {/* <tr>
                    <td>
                      <strong>Last Updated</strong>
                    </td>
                    <td>{formatDate(order.updatedat)}</td>
                  </tr> */}
                </tbody>
              </Table>

              {order.order_status === "processing" && (
                <Button
                  variant="primary"
                  onClick={() => setShowUpdateModal(true)}
                  className="mt-3 me-2"
                >
                  Update Status
                </Button>
              )}

    {/* Only show Generate Invoice button if order exists and is shipped */}
{order && order.order_status === "shipped" && (
  <Button
    variant="success"
    onClick={() => fetchInvoice(order.order_id)}
    className="mt-3"
    disabled={loading}
  >
    {loading ? (
      <>
        <Spinner as="span" animation="border" size="sm" />
        <span className="ms-2">Generating...</span>
      </>
    ) : (
      "Generate Invoice"
    )}
  </Button>
)}

              {order.order_status !== "processing" && (
                <div className="mt-3">
                  {/* <Alert variant="info" className="mb-0">
                    Status cannot be updated for {order.order_status} orders.
                  </Alert> */}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Customer Details */}
        <div className="col-md-6 mb-4">
          <Card>
            <Card.Header className="bg-transparent">
              <h5>Customer Details</h5>
            </Card.Header>
            <Card.Body>
              <Table className=" custom-data-table">
                <tbody>
                  <tr>
                    <td>
                      <strong>Name</strong>
                    </td>
                    <td>{order.user_details?.name || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Email</strong>
                    </td>
                    <td>{order.user_details?.email || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Phone</strong>
                    </td>
                    <td>{order.user_details?.phone || "N/A"}</td>
                  </tr>
                </tbody>
              </Table>

              <h5 className="mt-4">Shipping Address</h5>
              <Table className=" custom-data-table">
                <tbody>
                  <tr>
                    <td>
                      <strong>Address</strong>
                    </td>
                    <td>{order.shipping_address?.address || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Suburb</strong>
                    </td>
                    <td>{order.shipping_address?.suburb || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>State</strong>
                    </td>
                    <td>{order.shipping_address?.state || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Postcode</strong>
                    </td>
                    <td>{order.shipping_address?.postcode || "N/A"}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Order Items */}
      <div className="row">
        <div className="col-12">
          <Card>
            <Card.Header className="bg-transparent">
              <h5>Order Items</h5>
            </Card.Header>
            <Card.Body>
              <Table striped  hover responsive className="custom-data-table">
                <thead>
                  <tr >
                    <th >Product</th>
                    <th>Image</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.length > 0 ? (
                    order.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>
                          <img
                            src={item.image || "https://via.placeholder.com/50"}
                            alt={item.product_name}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/50";
                            }}
                          />
                        </td>
                        <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td>${parseFloat(item.total_price).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                required
              >
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
               
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tracking Status</Form.Label>
              <Form.Control
                type="text"
                value={trackingStatus}
                onChange={(e) => setTrackingStatus(e.target.value)}
                placeholder="Enter tracking status"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStatusUpdate}
            disabled={updating || !statusUpdate}
          >
            {updating ? (
              <>
                <Spinner as="span" animation="border" size="sm" />
                <span className="ms-2">Updating...</span>
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderDetails;