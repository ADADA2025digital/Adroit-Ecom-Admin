import React, { useEffect, useState, useRef } from "react";
import "../Assets/Styles/Style.css";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "datatables.net-responsive-dt";
import "datatables.net";
import { Spinner, Alert, Modal, Carousel, Card, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ButtonGlobal from "../Components/Button";
import api from "../config/axiosConfig";
import { getCookie } from "../config/utils";

const ReviewList = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const tableRef = useRef(null);
  const dataTableInitialized = useRef(false);
  const dataTableInstance = useRef(null);
  const liveUpdateInterval = useRef(null);

  const fetchAllReviews = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const token = getCookie("token");
      if (!token) throw new Error("Authentication token not found");

      let allReviews = [];
      let currentPage = 1;
      let hasMorePages = true;

      // Fetch all pages until we have all reviews
      while (hasMorePages) {
        const response = await api.get(
          `/admin/reviews?page=${currentPage}&per_page=100&status=all&sort_by=created_at&sort_order=desc`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.data.success) {
          throw new Error("Failed to fetch reviews");
        }

        // Add reviews from current page
        allReviews = [...allReviews, ...response.data.reviews];

        // Check if there are more pages
        const pagination = response.data.pagination;
        hasMorePages = currentPage < pagination.last_page;
        currentPage++;
      }

      const formatted = allReviews.map((rev, idx) => ({
        index: idx + 1,
        review_id: rev.review_id,
        order_id: rev.order_id,
        user_name: rev.user?.name || "N/A",
        user_email: rev.user?.email || "N/A",
        product_name: rev.product?.name || "N/A",
        product_id: rev.product_id,
        rating: rev.rating,
        comment: rev.comment,
        status: rev.status,
        images: rev.images || [],
        created_at: rev.created_at,
      }));

      setReviews(formatted);
      setLastRefreshTime(new Date());
      console.log(`Loaded ${formatted.length} reviews`);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch reviews"
      );
      console.error("API Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Smart update function that preserves DataTable state
  const updateDataTableWithStatePreservation = (newReviews) => {
    if (!dataTableInstance.current) return;

    // Get current DataTable state before update
    const currentSearch = dataTableInstance.current.search();
    const currentPage = dataTableInstance.current.page();
    const currentPageInfo = dataTableInstance.current.page.info();
    const currentOrder = dataTableInstance.current.order();
    const currentSettings = dataTableInstance.current.settings()[0];

    // Update the data
    dataTableInstance.current.clear();
    dataTableInstance.current.rows.add(newReviews);
    dataTableInstance.current.draw();

    // Restore search state
    if (currentSearch) {
      dataTableInstance.current.search(currentSearch);
    }

    // Restore order/sorting
    if (currentOrder && currentOrder.length > 0) {
      dataTableInstance.current.order(currentOrder);
    }

    // Restore pagination position if possible
    if (currentPage >= 0 && currentPage < currentPageInfo.pages) {
      const newPageInfo = dataTableInstance.current.page.info();
      const targetPage = Math.min(currentPage, newPageInfo.pages - 1);
      dataTableInstance.current.page(targetPage).draw("page");
    } else {
      dataTableInstance.current.draw(false); // Draw without resetting paging
    }
  };

  const updateReviewStatus = async (reviewId, newStatus) => {
    try {
      const token = getCookie("token");
      if (!token) throw new Error("Authentication token not found");

      let res;
      if (newStatus === "approved") {
        res = await api.post(
          `/admin/reviews/${reviewId}/approve`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (newStatus === "rejected") {
        res = await api.delete(`/admin/reviews/${reviewId}/reject`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        throw new Error("Invalid status");
      }

      if (res.data.success) {
        // Update the reviews state immediately
        const updatedReviews = reviews.map((r) =>
          r.review_id === reviewId ? { ...r, status: newStatus } : r
        );

        setReviews(updatedReviews);

        // Update DataTable with state preservation
        if (dataTableInstance.current) {
          updateDataTableWithStatePreservation(updatedReviews);
        }

        console.log(`Review ${reviewId} ${newStatus} successfully`);

        // Update the selected review in modal if it's open
        if (showDetailModal && selectedReview?.review_id === reviewId) {
          setSelectedReview((prev) =>
            prev ? { ...prev, status: newStatus } : null
          );
        }

        return true;
      } else {
        setError(res.data.message || `Failed to ${newStatus} review`);
        return false;
      }
    } catch (err) {
      console.error(`Error ${newStatus} review:`, err);
      setError(err.response?.data?.message || `Failed to ${newStatus} review`);
      return false;
    }
  };

  // Live update function - fetches all reviews
  const performLiveUpdate = async () => {
    try {
      const token = getCookie("token");
      if (!token) return;

      let allReviews = [];
      let currentPage = 1;
      let hasMorePages = true;

      // Fetch all pages
      while (hasMorePages) {
        const response = await api.get(
          `/admin/reviews?page=${currentPage}&per_page=100&status=all&sort_by=created_at&sort_order=desc`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          allReviews = [...allReviews, ...response.data.reviews];

          const pagination = response.data.pagination;
          hasMorePages = currentPage < pagination.last_page;
          currentPage++;
        } else {
          break;
        }
      }

      const formatted = allReviews.map((rev, idx) => ({
        index: idx + 1,
        review_id: rev.review_id,
        order_id: rev.order_id,
        user_name: rev.user?.name || "N/A",
        user_email: rev.user?.email || "N/A",
        product_name: rev.product?.name || "N/A",
        product_id: rev.product_id,
        rating: rev.rating,
        comment: rev.comment,
        status: rev.status,
        images: rev.images || [],
        created_at: rev.created_at,
      }));

      // Only update if data has changed
      if (JSON.stringify(formatted) !== JSON.stringify(reviews)) {
        setReviews(formatted);

        // Update DataTable with state preservation
        if (dataTableInstance.current && dataTableInitialized.current) {
          updateDataTableWithStatePreservation(formatted);
        }

        setLastRefreshTime(new Date());
        console.log(
          `Live update completed - ${formatted.length} reviews loaded`
        );
      }
    } catch (err) {
      console.error("Live update error:", err);
      // Don't show error to user for live updates
    }
  };

  // Setup live updates
  const setupLiveUpdates = () => {
    // Clear any existing interval
    if (liveUpdateInterval.current) {
      clearInterval(liveUpdateInterval.current);
    }

    // Set up new interval (every 30 seconds)
    liveUpdateInterval.current = setInterval(() => {
      performLiveUpdate();
    }, 5000);

    return () => {
      if (liveUpdateInterval.current) {
        clearInterval(liveUpdateInterval.current);
      }
    };
  };

  const handleImageClick = (images, index = 0) => {
    console.log("Handling image click:", images);

    if (images && images.length > 0) {
      // Extract URLs from image objects
      const imageUrls = images
        .map((img) => {
          if (typeof img === "string") return img;
          return img.url || img.image_url || img.src;
        })
        .filter((url) => url && url.trim() !== "");

      console.log("Extracted image URLs:", imageUrls);

      if (imageUrls.length > 0) {
        setSelectedImages(imageUrls);
        setCurrentImageIndex(index);
        setShowImageModal(true);
      } else {
        console.warn("No valid image URLs found");
      }
    } else {
      console.warn("No images provided");
    }
  };

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const initializeDataTable = () => {
    if ($.fn.DataTable.isDataTable("#dataTable")) {
      $("#dataTable").DataTable().destroy();
    }

    const table = $("#dataTable").DataTable({
      data: reviews,
      destroy: true,
      columns: [
        { title: "ID", data: "index", className: "text-center", width: "50px" },
        { title: "Review ID", data: "review_id" },
        { title: "Order ID", data: "order_id" },
        { title: "User Name", data: "user_name" },
        { title: "Product Name", data: "product_name" },
        {
          title: "Rating",
          data: "rating",
          width: "110px",
          className: "text-center",
          render: (data) => {
            const rating = parseFloat(data);
            const full = Math.floor(rating);
            const half = rating % 1 >= 0.5;
            const empty = 5 - full - (half ? 1 : 0);
            let html = "";
            for (let i = 0; i < full; i++)
              html += '<i class="bi bi-star-fill text-warning"></i>';
            if (half) html += '<i class="bi bi-star-half text-warning"></i>';
            for (let i = 0; i < empty; i++)
              html += '<i class="bi bi-star text-warning"></i>';
            return `<div title="${rating} out of 5">${html}</div>`;
          },
        },
        {
          title: "Comment",
          data: "comment",
          render: (text) =>
            text
              ? text.length > 50
                ? `${text.substring(0, 50)}...`
                : text
              : "No comment",
        },
        {
          title: "Images",
          data: "images",
          className: "text-center",
          orderable: false,
          render: (imgs, type, row) => {
            if (!imgs || imgs.length === 0) {
              return "<span>No images</span>";
            }

            // Get the first image URL
            const firstImage =
              typeof imgs[0] === "string"
                ? imgs[0]
                : imgs[0].url || imgs[0].image_url;

            return `
      <div class="image-container" style="display: inline-flex; align-items: center;">
        <img src="${firstImage}" alt="Review image"
             class="review-thumbnail"
             style="width:50px;height:50px;object-fit:cover;cursor:pointer;border:1px solid #ddd;border-radius:4px;"
             data-images='${JSON.stringify(imgs)}'
        />
      </div>
    `;
          },
        },
        {
          title: "Status",
          data: "status",
          className: "text-center",
          width: "120px",
          render: (st) => {
            const statusConfig = {
              approved: { class: "badge bg-success", label: "Approved" },
              rejected: { class: "badge bg-danger", label: "Rejected" },
              pending: { class: "badge bg-warning", label: "Pending" },
            };

            const config = statusConfig[st] || {
              class: "badge bg-secondary",
              label: st,
              icon: "bi-question-circle",
            };

            return `
              <span class="${config.class}">
                <i class="bi ${config.icon} me-1"></i>${config.label}
              </span>
            `;
          },
        },
        {
          title: "Action",
          className: "text-center",
          width: "50px",
          data: null,
          orderable: false,
          render: function (data, type, row) {
            return `
              <i class="bi bi-eye view-icon" data-review-id="${row.review_id}" style="cursor:pointer;font-size:1.2rem;color:#6c757d;"></i>
            `;
          },
        },
      ],
      responsive: false,
      scrollX: true,
      language: { emptyTable: "No reviews found" },
      order: [[0, "asc"]],
      pageLength: 10,
      lengthMenu: [10, 20, 50, 100],
      drawCallback: function (settings) {
        attachEventHandlers();
      },
      initComplete: function (settings, json) {
        attachEventHandlers();
        dataTableInitialized.current = true;

        // Start live updates after DataTable is initialized
        setupLiveUpdates();
      },
    });

    dataTableInstance.current = table;
    return table;
  };

  const attachEventHandlers = () => {
    // Remove existing handlers
    $(document).off("click", ".review-thumbnail");
    $(document).off("click", ".view-icon");

    // Image click handler
    $(document).on("click", ".review-thumbnail", function (e) {
      e.preventDefault();
      e.stopPropagation();

      try {
        const imagesData = $(this).data("images");
        console.log("Raw images data:", imagesData);

        if (imagesData) {
          // Parse the JSON string if it's a string
          const images =
            typeof imagesData === "string"
              ? JSON.parse(imagesData)
              : imagesData;
          handleImageClick(images, 0);
        }
      } catch (error) {
        console.error("Error handling image click:", error);
      }
    });

    // View details handler
    $(document).on("click", ".view-icon", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const reviewId = $(this).data("review-id");
      const review = reviews.find((r) => r.review_id === reviewId);

      if (review) {
        handleViewDetails(review);
      }
    });
  };

  useEffect(() => {
    fetchAllReviews();

    // Cleanup on component unmount
    return () => {
      if (liveUpdateInterval.current) {
        clearInterval(liveUpdateInterval.current);
      }
      if (dataTableInstance.current) {
        dataTableInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && reviews.length > 0 && !dataTableInitialized.current) {
      console.log("Initializing DataTable with reviews:", reviews.length);
      initializeDataTable();
    }
  }, [reviews, loading]);

  const handleRefresh = () => {
    // Clear live updates during manual refresh
    if (liveUpdateInterval.current) {
      clearInterval(liveUpdateInterval.current);
    }

    if ($.fn.DataTable.isDataTable("#dataTable")) {
      $("#dataTable").DataTable().destroy();
      dataTableInitialized.current = false;
      dataTableInstance.current = null;
    }

    fetchAllReviews(true).then(() => {
      // Restart live updates after manual refresh
      setTimeout(() => {
        setupLiveUpdates();
      }, 1000);
    });
  };

  const handleCloseModal = () => {
    setShowImageModal(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReview(null);
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
          <Alert.Heading>Error Loading Reviews</Alert.Heading>
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
        <h4 className="H4-heading fw-bold">Review</h4>
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

      <div className="card mt-1 p-3 rounded-3 shadow">
        <div className="mb-3">
          <strong>Total Reviews: {reviews.length}</strong>
        </div>
        <table
          id="dataTable"
          ref={tableRef}
          className="table table-striped table-hover custom-data-table w-100"
        />
      </div>

      {/* Image Modal */}
      <Modal show={showImageModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Review Images{" "}
            {selectedImages.length > 0 &&
              `(${currentImageIndex + 1} of ${selectedImages.length})`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedImages.length > 0 ? (
            <>
              {/* Main Image Display */}
              <div className="mb-3">
                <img
                  src={selectedImages[currentImageIndex]}
                  alt={`Review image ${currentImageIndex + 1}`}
                  style={{
                    width: "100%",
                    height: "400px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
                />
              </div>

              {/* Thumbnail Gallery */}
              {selectedImages.length > 1 && (
                <div className="thumbnail-gallery">
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      maxHeight: "100px",
                      overflowX: "auto",
                      padding: "10px 0",
                    }}
                  >
                    {selectedImages.map((img, index) => (
                      <div
                        key={index}
                        style={{
                          border:
                            index === currentImageIndex
                              ? "3px solid #007bff"
                              : "2px solid #dee2e6",
                          borderRadius: "6px",
                          padding: "2px",
                          cursor: "pointer",
                          opacity: index === currentImageIndex ? 1 : 0.7,
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/60x60?text=Error";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                height: "400px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p className="text-muted">No images to display</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <ButtonGlobal
            className="btn btn-outline-secondary"
            onClick={handleCloseModal}
            text="Close"
          />
        </Modal.Footer>
      </Modal>

      {/* Review Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={handleCloseDetailModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="d-flex align-items-center">
            Review Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedReview ? (
            <div className="row">
              {/* Review Information */}
              <div className="col-md-6">
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-bottom">
                    <h6 className="mb-0 d-flex align-items-center">
                      <i className="bi bi-info-circle text-secondary me-2"></i>
                      Review Information
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-transparent  rounded">
                      <strong>Review ID:</strong>
                      <span>{selectedReview.review_id}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-transparent  rounded">
                      <strong>Order ID:</strong>
                      <span>{selectedReview.order_id}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-transparent  rounded">
                      <strong>Product:</strong>
                      <span className="text-end">
                        {selectedReview.product_name}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-transparent  rounded">
                      <strong>Rating:</strong>
                      <div className="d-flex align-items-center">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`bi ${
                              i < Math.floor(selectedReview.rating)
                                ? "bi-star-fill text-warning"
                                : i < selectedReview.rating
                                ? "bi-star-half text-warning"
                                : "bi-star text-warning"
                            } me-1`}
                          />
                        ))}
                        <span className="ms-2 ">
                          ({selectedReview.rating}/5)
                        </span>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-transparent  rounded">
                      <strong>Status:</strong>
                      <Badge
                        bg={
                          selectedReview.status === "approved"
                            ? "success"
                            : selectedReview.status === "rejected"
                            ? "danger"
                            : selectedReview.status === "pending"
                            ? "warning"
                            : "info"
                        }
                        className="px-3 py-2"
                      >
                        <i
                          className={`bi ${
                            selectedReview.status === "approved"
                              ? "bi-check-circle"
                              : selectedReview.status === "rejected"
                              ? "bi-x-circle"
                              : selectedReview.status === "pending"
                              ? "bi-clock"
                              : "bi-gear"
                          } me-1`}
                        ></i>
                        {selectedReview.status}
                      </Badge>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 bg-transparent rounded">
                      <strong>Date:</strong>
                      <span>
                        {new Date(selectedReview.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* User Information & Comment */}
              <div className="col-md-6">
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-bottom ">
                    <h6 className="mb-0 d-flex align-items-center ">
                      <i className="bi bi-person-circle text-secondary me-2"></i>
                      User Information
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-transparent rounded">
                      <strong>Name:</strong>
                      <span>{selectedReview.user_name}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 bg-transparent  rounded">
                      <strong>Email:</strong>
                      <span className="text-break">
                        {selectedReview.user_email}
                      </span>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-bottom">
                    <h6 className="mb-0 d-flex align-items-center">
                      <i className="bi bi-chat-left-text text-secondary me-2"></i>
                      Customer Comment
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="p-3 bg-transparent  rounded">
                      <p className="mb-0 " style={{ lineHeight: "1.6" }}>
                        {selectedReview.comment || (
                          <span className="text-muted fst-italic">
                            No comment provided
                          </span>
                        )}
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Review Images */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="col-12 mt-3">
                  <Card className="border-0  shadow-sm">
                    <Card.Header className=" bg-transparent  border-bottom">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i className="bi bi-images text-secondary me-2"></i>
                        Review Images
                        <Badge bg="secondary" className="ms-2">
                          {selectedReview.images.length}
                        </Badge>
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex flex-wrap gap-3 justify-content-center">
                        {selectedReview.images.map((img, index) => {
                          const imgUrl =
                            typeof img === "string"
                              ? img
                              : img.url || img.image_url;
                          return (
                            <div key={index} className="position-relative">
                              <img
                                src={imgUrl}
                                alt={`Review image ${index + 1}`}
                                className="img-thumbnail"
                                style={{
                                  width: "100px",
                                  height: "100px",
                                  objectFit: "cover",
                                  cursor: "pointer",
                                  transition: "transform 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.target.style.transform = "scale(1.05)")
                                }
                                onMouseLeave={(e) =>
                                  (e.target.style.transform = "scale(1)")
                                }
                                onClick={() =>
                                  handleImageClick(selectedReview.images, index)
                                }
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/100x100?text=Image+Error";
                                }}
                              />
                              <div className="position-absolute top-0 start-100 translate-middle">
                                <Badge bg="dark" pill>
                                  {index + 1}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Action Buttons Section */}
              <div className="col-12 mt-4">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-bottom">
                    <h6 className="mb-0 d-flex align-items-center">
                      <i className="bi bi-lightning-charge text-secondary me-2"></i>
                      Review Actions
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex gap-3 flex-wrap justify-content-center">
                      {selectedReview.status !== "approved" && (
                        <ButtonGlobal
                          className="btn btn-success d-flex align-items-center"
                          onClick={() =>
                            updateReviewStatus(
                              selectedReview.review_id,
                              "approved"
                            )
                          }
                        >
                          <i className="bi bi-check-circle me-2"></i>
                          Approve Review
                        </ButtonGlobal>
                      )}
                      {selectedReview.status !== "rejected" && (
                        <ButtonGlobal
                          className="btn btn-danger d-flex align-items-center"
                          onClick={() =>
                            updateReviewStatus(
                              selectedReview.review_id,
                              "rejected"
                            )
                          }
                        >
                          <i className="bi bi-x-circle me-2"></i>
                          Reject Review
                        </ButtonGlobal>
                      )}
                      <ButtonGlobal
                        className="btn btn-outline-secondary d-flex align-items-center"
                        onClick={handleCloseDetailModal}
                      >
                        <i className="bi bi-x-lg me-2"></i>
                        Close
                      </ButtonGlobal>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <i
                className="bi bi-exclamation-triangle text-warning"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="mt-3 text-muted">No review details available.</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ReviewList;
