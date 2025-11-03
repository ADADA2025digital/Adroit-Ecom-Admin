import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Container,
  Table,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import api from "../../config/axiosConfig";
import companyLogo from "../../Assets/Images/logodark.png";

const Invoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = React.useState(location.state?.invoice || null);
  const [loading, setLoading] = React.useState(!location.state?.invoice);
  const [error, setError] = React.useState(null);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching invoice data for:", orderId);

      const response = await api.get(`/invoice/${orderId}`);

      console.log("Invoice API response:", response.data);

      if (response.data.success) {
        setInvoice(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch invoice data");
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);

      if (err.response?.status === 404) {
        setError(
          `Invoice not found for order ${orderId}. The order may not exist or you may not have permission to access it.`
        );
      } else if (err.response?.status === 401) {
        setError("Authentication required. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch invoice. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoice data if not passed via state
  React.useEffect(() => {
    if (!invoice) {
      fetchInvoiceData();
    }
  }, [orderId, invoice, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
      order_placed: "secondary",
      default: "secondary",
    };
    return statusMap[status?.toLowerCase()] || statusMap.default;
  };

  const handlePrint = () => {
    const originalStyles = document.createElement("style");
    originalStyles.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .invoice-container, .invoice-container * {
          visibility: visible;
        }
        .invoice-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(originalStyles);

    window.print();

    setTimeout(() => {
      document.head.removeChild(originalStyles);
    }, 500);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error}
          <div className="mt-2">
            <Button
              variant="outline-secondary"
              onClick={() => fetchInvoiceData()}
            >
              Retry
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => navigate(-1)}
              className="ms-2"
            >
              Go back
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          No invoice data available
          <div className="mt-2">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      className="bg-light py-4 mt-4 invoice-container"
      style={{ maxWidth: "900px" }}
    >
      {/* Print controls - only visible on screen */}
      <div className="d-print-none mb-4 text-end">
        <Button
          variant="outline-primary"
          onClick={handlePrint}
          className="me-2"
        >
          <i className="bi bi-printer-fill me-2"></i>Print Invoice
        </Button>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i>Back to Order
        </Button>
      </div>

      {/* Invoice content */}
      <div className="invoice-content">
        {/* Invoice Header with Logo */}
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-4">
          <div className="d-flex align-items-center">
            <div className="me-3" style={{ width: "150px" }}>
              <img
                src={companyLogo}
                alt="Company Logo"
                className="img-fluid"
                style={{ maxHeight: "80px", objectFit: "contain" }}
              />
            </div>
            <div>
              <p className="text-muted mb-0">
                Invoice #: {invoice.invoice_number}
              </p>
            </div>
          </div>
          <div className="text-end">
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              123 Business Street
              <br />
              City, State 10001
              <br />
              Phone: (123) 456-7890
              <br />
              Email: info@yourcompany.com
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card border-0 bg-light shadow-sm">
              <div className="card-header bg-light">
                <h5 className="mb-0 text-dark">Bill To</h5>
              </div>
              <div className="card-body">
                <p className="mb-1 text-dark">
                  <strong>{invoice.user?.full_name || "N/A"}</strong>
                </p>
                <p className="mb-1 text-muted">
                  {invoice.billing_address || "N/A"}
                </p>
                <p className="mb-1 text-muted">
                  Email: {invoice.user?.email || "N/A"}
                </p>
                <p className="mb-0 text-muted">
                  Phone: {invoice.user?.phone || "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6 mt-3 mt-md-0">
            <div className="card border-0 bg-light shadow-sm">
              <div className="card-header bg-light">
                <h5 className="mb-0 text-dark">Invoice Details</h5>
              </div>
              <div className="card-body">
                <Table borderless className="mb-0">
                  <tbody>
                    <tr>
                      <td>
                        <strong>Order ID:</strong>
                      </td>
                      <td>{invoice.order_id}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Invoice Date:</strong>
                      </td>
                      <td>{formatDate(invoice.invoice_date)}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Due Date:</strong>
                      </td>
                      <td>{formatDate(invoice.due_date)}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Payment Status:</strong>
                      </td>
                      <td>
                        <Badge
                          bg={
                            invoice.payment_status === "paid"
                              ? "success"
                              : "danger"
                          }
                        >
                          {invoice.payment_status}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Payment Method:</strong>
                      </td>
                      <td className="text-capitalize">
                        {invoice.payment_method}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-4">
          <Table bordered hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "45%" }}>Product</th>
                <th style={{ width: "15%" }} className="text-end">
                  Unit Price
                </th>
                <th style={{ width: "10%" }} className="text-center">
                  Qty
                </th>
                <th style={{ width: "15%" }} className="text-end">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.product_name}</td>
                  <td className="text-end">
                    ${parseFloat(item.unit_price).toFixed(2)}
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-end">
                    ${parseFloat(item.total_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Totals */}
        <div className="row justify-content-end">
          <div className="col-md-5">
            <Table bordered className="mb-4">
              <tbody>
                <tr>
                  <td>
                    <strong>Subtotal:</strong>
                  </td>
                  <td className="text-end">
                    ${parseFloat(invoice.subtotal).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Tax:</strong>
                  </td>
                  <td className="text-end">
                    ${parseFloat(invoice.tax_amount).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Shipping:</strong>
                  </td>
                  <td className="text-end">
                    ${parseFloat(invoice.shipping_cost).toFixed(2)}
                  </td>
                </tr>
                <tr className="table-active">
                  <td>
                    <strong>Total:</strong>
                  </td>
                  <td className="text-end">
                    ${parseFloat(invoice.total_amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-top">
          <p className="mb-2 text-muted">
            <strong>Thank you for your business!</strong>
          </p>
        </div>
      </div>
    </Container>
  );
};

export default Invoice;
