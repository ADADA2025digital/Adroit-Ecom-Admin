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
  Alert,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ButtonGlobal from "../../Components/Button";
import api from "../../config/axiosConfig";
import { getCookie } from "../../config/utils";
import InputField from "../../Components/InputField";
import TextAreaField from "../../Components/TextAreaField";

const Category = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    subcategory: "",
  });
  const [formErrors, setFormErrors] = useState({
    categoryName: "",
    description: "",
    subcategory: "",
  });
  const [touchedFields, setTouchedFields] = useState({
    categoryName: false,
    description: false,
    subcategory: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  // Dynamic Regex Validation Patterns
  const validationPatterns = {
    categoryName: {
      pattern: /^[a-zA-Z0-9][a-zA-Z0-9\s-]{1,48}[a-zA-Z0-9]$/,
      message: "Category name must be 3-50 characters, start and end with alphanumeric characters, and can contain spaces and hyphens",
      required: true
    },
    description: {
      pattern: /^[a-zA-Z0-9\s\-,.!?()@#$%&*+='"]{0,500}$/,
      message: "Description can contain letters, numbers, spaces, and common punctuation marks (max 500 characters)",
      required: false
    },
    subcategory: {
      pattern: /^[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*$/,
      message: "Subcategories must be comma-separated alphanumeric values without spaces (e.g., Smartphones,Laptops,Tablets)",
      required: false
    }
  };

  // Dynamic validation function
  const validateField = (name, value) => {
    const patternConfig = validationPatterns[name];
    
    if (!patternConfig) {
      return ""; // No validation pattern for this field
    }

    // Check if field is required and empty
    if (patternConfig.required && !value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    // If field is optional and empty, it's valid
    if (!patternConfig.required && !value.trim()) {
      return "";
    }

    // Special handling for subcategory field
    if (name === "subcategory" && value.trim()) {
      const subcategories = value.split(",").map(s => s.trim()).filter(s => s.length > 0);
      
      // Check each subcategory individually
      for (const subcat of subcategories) {
        if (!patternConfig.pattern.test(subcat)) {
          return patternConfig.message;
        }
      }
      
      // Additional check for duplicate subcategories
      const uniqueSubcategories = [...new Set(subcategories)];
      if (uniqueSubcategories.length !== subcategories.length) {
        return "Duplicate subcategories are not allowed";
      }
      
      return "";
    }

    // For other fields, test against the pattern
    if (!patternConfig.pattern.test(value.trim())) {
      return patternConfig.message;
    }

    return ""; // No error
  };

  useEffect(() => {
    const token = getCookie("token") || localStorage.getItem("token");
    console.log("Retrieved token from storage:", token);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      console.log("Starting to fetch categories...");

      const token = getCookie("token") || localStorage.getItem("token");
      console.log("Using token for request:", token);

      const response = await api.get("/getcategory", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Categories API response:", response.data);

      // Reverse the array to show newest first, but maintain proper numbering
      const reversedData = [...response.data].reverse();

      const categoriesFromAPI = reversedData.map((item, index) => ({
        index: index + 1, // This will show 1, 2, 3 in the table
        id: item.id,
        categoryName: item.categoryname,
        description: item.cat_description,
        subcategory: JSON.parse(item.subcategories).join(", "),
        // Add a hidden timestamp for proper sorting
        createdAt: item.createdAt || Date.now() + index,
      }));

      console.log("Processed categories data:", categoriesFromAPI);
      setData(categoriesFromAPI);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Error fetching categories:", {
        message: error.message,
        config: error.config,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError("Failed to fetch categories. Please try again.");
      setToastVariant("danger");
      setToastMessage("Failed to fetch categories. Please try again.");
      setShowToast(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const breadcrumbItems = [
    { label: "Product", link: "/product", active: true },
    { label: "Category", link: "/category", active: true },
  ];

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate the field after blur
    const error = validateField(name, formData[name]);
    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Form field changed - ${name}:`, value);

    // Update form data
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    // If the field has been touched, validate it
    if (touchedFields[name]) {
      const error = validateField(name, value);
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: error,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate all fields
    Object.keys(formData).forEach(fieldName => {
      errors[fieldName] = validateField(fieldName, formData[fieldName]);
    });

    setFormErrors(errors);

    // Check if form is valid (no errors)
    return !Object.values(errors).some((error) => error !== "");
  };

  const handleAdd = async () => {
    // Mark all fields as touched to show validation errors
    const allTouchedFields = {};
    Object.keys(formData).forEach(field => {
      allTouchedFields[field] = true;
    });
    setTouchedFields(allTouchedFields);

    // Check if category already exists
    const categoryExists = await checkCategoryExists(
      formData.categoryName.trim()
    );
    if (categoryExists) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        categoryName: "Category name already exists",
      }));
      return;
    }

    // Then do your normal validation
    if (!validateForm()) {
      setToastVariant("warning");
      setToastMessage("Please fix the validation errors before submitting.");
      setShowToast(true);
      return;
    }

    setLoading(true);
    setError(null);
    console.log("Starting to add category with data:", formData);

    try {
      const token = getCookie("token") || localStorage.getItem("token");
      console.log("Using token for request:", token);

      // Convert comma-separated subcategories to array
      const subcategoriesArray = formData.subcategory
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        categoryname: formData.categoryName.trim(),
        cat_description: formData.description.trim(),
        subcategories: subcategoriesArray, // Send as array, not string
      };

      console.log("Sending add payload:", payload);

      const response = await api.post("/storecategory", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Add category response:", response.data);

      await fetchCategories();
      setShowModal(false);
      setFormData({
        categoryName: "",
        description: "",
        subcategory: "",
      });
      setTouchedFields({
        categoryName: false,
        description: false,
        subcategory: false,
      });

      // Show success toast
      setToastVariant("success");
      setToastMessage("Category added successfully!");
      setShowToast(true);
    } catch (error) {
      console.error("Error adding category:", {
        message: error.message,
        config: error.config,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(
        error.response?.data?.message ||
          "Failed to add category. Please try again."
      );
      setToastVariant("danger");
      setToastMessage(
        error.response?.data?.message ||
          "Failed to add category. Please try again."
      );
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const checkCategoryExists = async (categoryName) => {
    try {
      const token = getCookie("token") || localStorage.getItem("token");
      const response = await api.get("/getcategory", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if category name already exists (excluding current category in edit mode)
      const existingCategory = response.data.find(
        (category) =>
          category.categoryname.toLowerCase().trim() ===
            categoryName.toLowerCase().trim() &&
          (editMode === "add" || category.id !== selectedId)
      );

      return !!existingCategory;
    } catch (error) {
      console.error("Error checking existing categories:", error);
      return false;
    }
  };

  const handleSave = async () => {
    // Mark all fields as touched to show validation errors
    const allTouchedFields = {};
    Object.keys(formData).forEach(field => {
      allTouchedFields[field] = true;
    });
    setTouchedFields(allTouchedFields);

    // Check if category already exists (excluding current category)
    const categoryExists = await checkCategoryExists(
      formData.categoryName.trim()
    );
    if (categoryExists) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        categoryName: "Category name already exists",
      }));
      setToastVariant("warning");
      setToastMessage(
        "Category name already exists. Please choose a different name."
      );
      setShowToast(true);
      return;
    }

    // Then do your normal validation
    if (!validateForm()) {
      setToastVariant("warning");
      setToastMessage("Please fix the validation errors before submitting.");
      setShowToast(true);
      return;
    }
    setLoading(true);
    setError(null);
    console.log(
      "Starting to update category ID:",
      selectedId,
      "with data:",
      formData
    );

    try {
      const token = getCookie("token") || localStorage.getItem("token");
      console.log("Using token for request:", token);

      // Convert comma-separated subcategories to array
      const subcategoriesArray = formData.subcategory
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Prepare payload according to API requirements
      const payload = {
        categoryname: formData.categoryName.trim(),
        cat_description: formData.description.trim(),
        subcategories: subcategoriesArray, // Send as array, not JSON string
      };

      console.log("Sending update payload:", payload);

      // Make the API call - using PUT method as per REST conventions
      const response = await api.post(`/editcategory/${selectedId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Update response:", response.data);

      // Refresh the categories list
      await fetchCategories();

      // Close the modal and reset form
      setShowModal(false);
      setFormData({
        categoryName: "",
        description: "",
        subcategory: "",
      });
      setTouchedFields({
        categoryName: false,
        description: false,
        subcategory: false,
      });

      // Show success toast
      setToastVariant("success");
      setToastMessage("Category updated successfully!");
      setShowToast(true);
    } catch (error) {
      console.error("Detailed error updating category:", {
        message: error.message,
        config: error.config,
        request: error.request,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        },
        stack: error.stack,
      });

      if (error.response?.status === 422) {
        // Handle validation errors
        const validationErrors = error.response.data.errors || {};
        const errorMessages = Object.values(validationErrors).flat().join(", ");
        setError(`Validation errors: ${errorMessages}`);
        setToastVariant("danger");
        setToastMessage(`Validation errors: ${errorMessages}`);
        setShowToast(true);
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to update category. Please try again."
        );
        setToastVariant("danger");
        setToastMessage(
          error.response?.data?.message ||
            "Failed to update category. Please try again."
        );
        setShowToast(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    console.log("Starting to delete category ID:", selectedId);

    try {
      const token = getCookie("token") || localStorage.getItem("token");
      console.log("Using token for request:", token);

      const response = await api.post(`/deletecategory/${selectedId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Delete response:", response.data);

      await fetchCategories();
      setShowModal(false);

      // Show success toast
      setToastVariant("success");
      setToastMessage("Category deleted successfully!");
      setShowToast(true);
    } catch (error) {
      console.error("Error deleting category:", {
        message: error.message,
        config: error.config,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(
        error.response?.data?.message ||
          "Failed to delete category. Please try again."
      );
      setToastVariant("danger");
      setToastMessage(
        error.response?.data?.message ||
          "Failed to delete category. Please try again."
      );
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      console.log("Initializing DataTable with data:", data);
      let table;

      if ($.fn.dataTable.isDataTable("#dataTable")) {
        console.log("DataTable already exists, refreshing data");
        table = $("#dataTable").DataTable();
        table.clear();
        table.rows.add(data);
        table.draw();
      } else {
        console.log("Creating new DataTable instance");
        table = $("#dataTable").DataTable({
          data: data,
          responsive: false,
          scrollX: true,
          columns: [
            {
              title: "ID",
              data: "index", // Use the index for auto-increment
              className: "text-center ",
            },
            { title: "Category Name", data: "categoryName" },
            { title: "Description", data: "description" },
            { title: "Subcategory", data: "subcategory" },
            {
              title: "Action",
              data: null,
              className: "text-center",
              render: function (data, type, row) {
                return `
                  <i class="bi bi-pencil-square edit-icon" data-id="${row.id}""></i>
                `;
              },
            },
          ],

          language: {
            emptyTable: "No categories found",
          },
          order: [],
          ordering: true, // Sort by the auto-increment column by default
        });
      }

      // Clean up previous event handlers
      $("#dataTable tbody").off("click", ".delete-icon");
      $("#dataTable tbody").off("click", ".edit-icon");

      // Set up new event handlers
      $("#dataTable tbody").on("click", ".delete-icon", function () {
        const id = $(this).data("id");
        console.log("Delete icon clicked for ID:", id);
        setSelectedId(id);
        setEditMode(false);
        setShowModal(true);
      });

      $("#dataTable tbody").on("click", ".edit-icon", function () {
        const id = $(this).data("id");
        console.log("Edit icon clicked for ID:", id);
        const rowData = data.find((item) => item.id === id);
        if (rowData) {
          setSelectedId(id);
          setFormData({
            categoryName: rowData.categoryName,
            description: rowData.description,
            subcategory: rowData.subcategory,
          });
          setEditMode(true);
          setShowModal(true);
        }
      });

      return () => {
        console.log("Cleaning up DataTable");
        if (table) table.destroy();
      };
    }
  }, [data]);

  const handleRefresh = () => {
    fetchCategories(true); // Pass true to indicate it's a refresh operation
  };

  if (loading && data.length === 0) {
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

  if (error && data.length === 0) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Categories</Alert.Heading>
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
      {/* Toast Notification */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 2000 }}
      >
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={4000}
          autohide
          className="shadow-lg border-0 rounded-3"
        >
          <Toast.Header
            className={`text-white d-flex align-items-center ${
              toastVariant === "success"
                ? "bg-success"
                : toastVariant === "danger"
                ? "bg-danger"
                : toastVariant === "warning"
                ? "bg-warning text-dark"
                : "bg-info"
            }`}
          >
            <i
              className={`me-2 fs-5 ${
                toastVariant === "success"
                  ? "bi bi-check-circle-fill"
                  : toastVariant === "danger"
                  ? "bi bi-x-circle-fill"
                  : toastVariant === "warning"
                  ? "bi bi-exclamation-triangle-fill"
                  : "bi bi-info-circle-fill"
              }`}
            ></i>
            <strong className="me-auto">
              {toastVariant === "success"
                ? "Success"
                : toastVariant === "danger"
                ? "Error"
                : toastVariant === "warning"
                ? "Warning"
                : "Info"}
            </strong>
          </Toast.Header>
          <Toast.Body className="fs-6">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Category</h4>
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
          <ButtonGlobal
            type="button"
            text="Add Category"
            className="btn button-global"
            onClick={() => {
              console.log("Add Category button clicked");
              setFormData({
                categoryName: "",
                description: "",
                subcategory: "",
              });
              setFormErrors({
                categoryName: "",
                description: "",
                subcategory: "",
              });
              setTouchedFields({
                categoryName: false,
                description: false,
                subcategory: false,
              });
              setEditMode("add");
              setShowModal(true);
            }}
            disabled={loading}
          />
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

      {error && data.length > 0 && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      <div className="card shadow-sm p-0">
        <div className="mt-1 p-3 rounded-2 shadow">
          <table
            id="dataTable"
            className="table table-striped table-hover   custom-data-table"
          ></table>
        </div>
      </div>

      <Modal
        show={showModal}
        onHide={() => {
          console.log("Modal closed");
          setShowModal(false);
          setTouchedFields({
            categoryName: false,
            description: false,
            subcategory: false,
          });
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode === true
              ? "Edit Category"
              : editMode === false
              ? "Confirm Delete"
              : editMode === "add"
              ? "Add Category"
              : "Category Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editMode === "add" || editMode === true ? (
            <Form>
              <InputField
                label="Category Name"
                type="text"
                id="formCategoryName"
                name="categoryName"
                placeholder="Enter category name (3-50 characters)"
                value={formData.categoryName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                isInvalid={
                  touchedFields.categoryName && !!formErrors.categoryName
                }
                errorMessage={formErrors.categoryName}
                required
              />

              <TextAreaField
                label="Description"
                id="formDescription"
                name="description"
                rows={3}
                placeholder="Enter description (optional, max 500 characters)"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                isInvalid={
                  touchedFields.description && !!formErrors.description
                }
                errorMessage={formErrors.description}
              />

              <InputField
                label="Subcategory (comma separated)"
                type="text"
                id="formSubcategory"
                name="subcategory"
                placeholder="e.g. Smartphones,Laptops,Tablets (no spaces)"
                value={formData.subcategory}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                isInvalid={
                  touchedFields.subcategory && !!formErrors.subcategory
                }
                errorMessage={formErrors.subcategory}
              />
              <p className="fst-italic fw-light small">
                {validationPatterns.subcategory.message}
              </p>
            </Form>
          ) : editMode === false ? (
            <div className="text-center py-3">
              <h5>Confirm Deletion</h5>
              <p>Are you sure you want to delete this category?</p>
              <div className="border p-3 rounded bg-light">
                <p className="text-muted small mb-0">ID: {selectedId}</p>
              </div>
              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 border rounded">
              <div className="mb-3">
                <h6 className="text-secondary">Category Name</h6>
                <p className="mb-0">{formData.categoryName || "-"}</p>
              </div>
              <div className="mb-3">
                <h6 className="text-secondary">Description</h6>
                <p className="mb-0">{formData.description || "-"}</p>
              </div>
              <div>
                <h6 className="text-secondary">Subcategory</h6>
                <p className="mb-0">{formData.subcategory || "-"}</p>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => {
              console.log("Modal cancel/close button clicked");
              setShowModal(false);
              setTouchedFields({
                categoryName: false,
                description: false,
                subcategory: false,
              });
            }}
            disabled={loading}
          >
            {editMode === true || editMode === "add"
              ? "Cancel"
              : editMode === false
              ? "No"
              : "Close"}
          </Button>
          {editMode === true ? (
            <Button
              onClick={handleSave}
              style={{ backgroundColor: "#7a70ba", border: "none" }}
              disabled={loading || Object.values(formErrors).some(error => error !== "")}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          ) : editMode === "add" ? (
            <Button
              onClick={handleAdd}
              style={{ backgroundColor: "#7a70ba", border: "none" }}
              disabled={loading || Object.values(formErrors).some(error => error !== "")}
            >
              {loading ? "Adding..." : "Add"}
            </Button>
          ) : editMode === false ? (
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Deleting...
                </>
              ) : (
                "Yes, Delete Permanently"
              )}
            </Button>
          ) : null}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Category;