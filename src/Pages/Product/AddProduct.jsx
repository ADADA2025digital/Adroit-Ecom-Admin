import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Button,
  Row,
  Col,
  Card,
  Alert,
  Spinner,
  Breadcrumb,
} from "react-bootstrap";
import { BiArrowBack } from "react-icons/bi";
import { ToastContainer, Toast } from "react-bootstrap";
import api from "../../config/axiosConfig";
import { getCookie } from "../../config/utils";
import InputField from "../../Components/InputField";
import FileInputField from "../../Components/FileInputField";
import TextAreaField from "../../Components/TextAreaField";
import ButtonGlobal from "../../Components/Button";

// Define dynamic validation rules configuration
const validationRules = {
  productname: {
    pattern: /^[a-zA-Z0-9\s\-_]{3,100}$/,
    message: "Product name must be 3-100 characters (letters, numbers, spaces, hyphens, underscores)",
    required: true,
  },
  SKU: {
    pattern: /^[a-zA-Z0-9\-_]{4,50}$/,
    message: "SKU must be 4-50 alphanumeric characters with hyphens/underscores",
    required: true,
  },
  supplierSKU: {
    pattern: /^[a-zA-Z0-9\-_]{0,50}$/,
    message: "Supplier SKU must be up to 50 alphanumeric characters",
    required: false,
  },
  pro_price: {
    pattern: /^\d+(\.\d{1,2})?$/,
    message: "Price must be a positive number with up to 2 decimal places",
    required: true,
  },
  pro_quantity: {
    pattern: /^\d+$/,
    message: "Quantity must be a positive whole number",
    required: true,
  },
  categoryname: {
    required: true,
    message: "Category is required",
  },
  metatitle: {
    pattern: /^.{0,60}$/,
    message: "Meta title should be under 60 characters",
    required: false,
  },
  metakeywords: {
    pattern: /^[a-zA-Z0-9,\s\-_]{0,200}$/,
    message: "Keywords should be comma-separated and under 200 characters",
    required: false,
  },
  pro_description: {
    maxLength: 2000,
    message: "Description cannot exceed 2000 characters",
    required: false,
  },
  specification: {
    maxLength: 1000,
    message: "Specifications cannot exceed 1000 characters",
    required: false,
  },
  metadescription: {
    maxLength: 160,
    message: "Meta description cannot exceed 160 characters",
    required: false,
  },
  metarobot: {
    pattern: /^(index|noindex|follow|nofollow)(,\s*(index|noindex|follow|nofollow))*$/,
    message: "Meta robots must be valid directives (e.g., index, follow)",
    required: false,
  },
};

// Dynamic validation function
const dynamicValidateForm = (formData) => {
  const errors = {};

  // Validate each field based on validationRules
  Object.keys(validationRules).forEach((fieldName) => {
    const rule = validationRules[fieldName];
    const value = formData[fieldName];

    // Check required fields
    if (rule.required && (!value || value.toString().trim() === "")) {
      errors[fieldName] = `${fieldName.replace(/_/g, " ")} is required`;
      return;
    }

    // Skip validation for empty optional fields
    if (!rule.required && (!value || value.toString().trim() === "")) {
      return;
    }

    // Pattern validation
    if (rule.pattern && value && !rule.pattern.test(value.toString())) {
      errors[fieldName] = rule.message;
      return;
    }

    // Max length validation
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[fieldName] = rule.message;
      return;
    }

    // Custom validation for specific fields
    switch (fieldName) {
      case "pro_price":
        if (value && parseFloat(value) <= 0) {
          errors[fieldName] = "Price must be greater than 0";
        }
        break;
      case "pro_quantity":
        if (value && parseInt(value) < 0) {
          errors[fieldName] = "Quantity cannot be negative";
        }
        break;
      default:
        break;
    }
  });

  // Special validation for images
  if (formData.images.length === 0) {
    errors.images = "At least one image is required";
  }

  return Object.keys(errors).length ? errors : null;
};

// Real-time field validation
const validateField = (name, value) => {
  const errors = {};
  const rule = validationRules[name];

  if (!rule) return errors;

  // Required validation
  if (rule.required && (!value || value.toString().trim() === "")) {
    errors[name] = `${name.replace(/_/g, " ")} is required`;
    return errors;
  }

  // Skip validation for empty optional fields
  if (!rule.required && (!value || value.toString().trim() === "")) {
    return errors;
  }

  // Pattern validation
  if (rule.pattern && value && !rule.pattern.test(value.toString())) {
    errors[name] = rule.message;
    return errors;
  }

  // Max length validation
  if (rule.maxLength && value && value.length > rule.maxLength) {
    errors[name] = rule.message;
    return errors;
  }

  // Custom validation for specific fields
  switch (name) {
    case "pro_price":
      if (value && parseFloat(value) <= 0) {
        errors[name] = "Price must be greater than 0";
      }
      break;
    case "pro_quantity":
      if (value && parseInt(value) < 0) {
        errors[name] = "Quantity cannot be negative";
      }
      break;
    default:
      break;
  }

  return errors;
};

const AddProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isMounted, setIsMounted] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  const [formData, setFormData] = useState({
    productname: "",
    pro_description: "",
    specification: "",
    SKU: "",
    supplierSKU: "",
    pro_price: "",
    pro_quantity: "",
    categoryname: "",
    subcategoryname: "",
    attach_doc: null,
    images: [],
    metatitle: "",
    metadescription: "",
    metakeywords: "",
    metarobot: "",
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState("success");
  const [toastMessage, setToastMessage] = useState("");

  // Show toast function
  const showToastMessage = (variant, message) => {
    setToastVariant(variant);
    setToastMessage(message);
    setShowToast(true);
  };

  // Fetch categories on mount
  useEffect(() => {
    console.log("AddProduct component mounted");

    const fetchCategories = async () => {
      try {
        console.log("Starting to fetch categories...");
        setCategoriesLoading(true);
        const token = getCookie("token") || localStorage.getItem("token");

        if (!token) {
          console.error("Authentication token missing");
          showToastMessage(
            "danger",
            "Authentication token missing. Please login again."
          );
          navigate("/login");
          return;
        }

        console.log("Making API call to fetch categories...");
        const response = await api.get("/getcategory", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Categories API response:", response.data);

        if (response.data && Array.isArray(response.data)) {
          const formattedCategories = response.data.map((category) => ({
            id: category.id,
            categoryname: category.categoryname,
            name: category.categoryname,
            subcategories: JSON.parse(category.subcategories || "[]"),
          }));

          console.log(
            "Formatted categories with subcategories:",
            formattedCategories
          );
          setCategories(formattedCategories);
        } else {
          console.error(
            "Unexpected categories response format:",
            response.data
          );
          showToastMessage(
            "danger",
            "Failed to load categories: Unexpected response format"
          );
        }
      } catch (err) {
        console.error("Error fetching categories:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });

        if (err.response?.status === 401) {
          showToastMessage("danger", "Session expired. Please login again.");
          navigate("/login");
        } else {
          showToastMessage(
            "danger",
            err.message || "Failed to load categories"
          );
        }
      } finally {
        if (isMounted) {
          console.log("Categories loading complete");
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      console.log("AddProduct component unmounting");
      setIsMounted(false);
    };
  }, [isMounted, navigate]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (!formData.categoryname) {
      setSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategoryname: "" }));
      return;
    }

    const fetchSubcategories = async () => {
      try {
        console.log(
          "Fetching subcategories for category:",
          formData.categoryname
        );
        setSubcategoriesLoading(true);

        const selectedCategory = categories.find(
          (cat) => cat.categoryname === formData.categoryname
        );

        if (selectedCategory && selectedCategory.subcategories) {
          console.log(
            "Found subcategories in category data:",
            selectedCategory.subcategories
          );
          setSubcategories(selectedCategory.subcategories);
          setFormData((prev) => ({
            ...prev,
            subcategoryname:
              selectedCategory.subcategories.length > 0 ? "" : "",
          }));
        } else {
          console.log("No subcategories found for selected category");
          setSubcategories([]);
        }
      } catch (err) {
        console.error("Error processing subcategories:", err);
        setSubcategories([]);
      } finally {
        setSubcategoriesLoading(false);
      }
    };

    fetchSubcategories();
  }, [formData.categoryname, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed - ${name}:`, value);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    const fieldErrors = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldErrors[name] || null,
    }));
  };

  // Handle numeric input changes
  const handleNumericChange = (e) => {
    const { name, value } = e.target;

    // Filter out non-numeric characters except decimal point
    if (name === "pro_quantity") {
      const filteredValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    } else if (name === "pro_price") {
      const filteredValue = value
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1");
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    } else {
      handleChange(e);
    }

    // Real-time validation
    const fieldErrors = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldErrors[name] || null,
    }));
  };

  // Prevent invalid key presses for numeric fields
  const handleKeyPress = (e) => {
    if (e.target.name === "pro_quantity") {
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    } else if (e.target.name === "pro_price") {
      if (
        !/[0-9.]/.test(e.key) ||
        (e.key === "." && e.target.value.includes("."))
      ) {
        e.preventDefault();
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type, file.size);

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      showToastMessage(
        "danger",
        "Invalid file type. Please upload PDF, DOC, or DOCX files."
      );
      return;
    }

    if (file.size > maxSize) {
      console.error("File size too large:", file.size);
      showToastMessage("danger", "File size too large. Maximum 10MB allowed.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      attach_doc: file,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    console.log(
      "Images selected:",
      files.map((f) => f.name)
    );

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024;
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      console.error("Invalid image files:", invalidFiles);
      showToastMessage(
        "danger",
        "Only JPG, PNG, or GIF images under 5MB are allowed."
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));

    // Validate images after upload
    const errors = dynamicValidateForm({ ...formData, images: [...formData.images, ...files] });
    setFieldErrors((prev) => ({
      ...prev,
      images: errors?.images || null,
    }));
  };

  const removeImage = (index) => {
    console.log("Removing image at index:", index);
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      images: updatedImages,
    }));

    // Validate images after removal
    const errors = dynamicValidateForm({ ...formData, images: updatedImages });
    setFieldErrors((prev) => ({
      ...prev,
      images: errors?.images || null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission started...");

    const validationErrors = dynamicValidateForm(formData);
    if (validationErrors) {
      console.log("Form validation failed:", validationErrors);
      setFieldErrors(validationErrors);
      showToastMessage("danger", "Please fix the validation errors");
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const formDataToSend = new FormData();

      console.log("Preparing form data for submission...");

      // Required fields
      formDataToSend.append("productname", formData.productname.trim());
      formDataToSend.append("SKU", formData.SKU.trim());
      formDataToSend.append("pro_price", formData.pro_price);
      formDataToSend.append("pro_quantity", formData.pro_quantity);
      formDataToSend.append("categoryname", formData.categoryname);

      // Optional fields
      if (formData.pro_description)
        formDataToSend.append("pro_description", formData.pro_description.trim());
      if (formData.specification)
        formDataToSend.append("specification", formData.specification.trim());
      if (formData.supplierSKU)
        formDataToSend.append("supplierSKU", formData.supplierSKU.trim());
      if (formData.subcategoryname)
        formDataToSend.append("subcategoryname", formData.subcategoryname.trim());
      if (formData.metatitle)
        formDataToSend.append("metatitle", formData.metatitle.trim());
      if (formData.metadescription)
        formDataToSend.append("metadescription", formData.metadescription.trim());
      if (formData.metakeywords)
        formDataToSend.append("metakeywords", formData.metakeywords.trim());
      if (formData.metarobot)
        formDataToSend.append("metarobot", formData.metarobot.trim());

      // Images
      formData.images.forEach((image, index) => {
        console.log(`Appending image ${index}:`, image.name);
        formDataToSend.append("images[]", image);
      });

      // Document
      if (formData.attach_doc) {
        console.log("Appending document:", formData.attach_doc.name);
        formDataToSend.append("attach_doc", formData.attach_doc);
      }

      const token = getCookie("token") || localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token missing. Please login again.");
      }

      console.log("Making API call to store product...");
      const response = await api.post("/storeproduct", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Product creation response:", response.data);

      if (response.data.message === "Product created successfully") {
        console.log("Product created successfully");
        showToastMessage(
          "success",
          "Product created successfully! Redirecting..."
        );
        setTimeout(() => navigate("/productlist"), 1500);
      }
    } catch (err) {
      console.error("Product creation error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      if (err.response?.status === 401) {
        showToastMessage(
          "danger",
          "Your session has expired. Please login again."
        );
        navigate("/login");
        return;
      }

      if (err.response?.status === 422) {
        const errors = err.response.data.errors || {};
        console.log("Validation errors from server:", errors);

        const formattedErrors = {};
        Object.entries(errors).forEach(([field, messages]) => {
          formattedErrors[field] = Array.isArray(messages)
            ? messages.join(", ")
            : messages;
        });

        setFieldErrors(formattedErrors);
        showToastMessage("danger", "Please fix the validation errors");
      } else {
        showToastMessage(
          "danger",
          err.message || err.response?.data?.message || "Failed to add product"
        );
      }
    } finally {
      console.log("Form submission completed");
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: "Product", link: "/product", active: true },
    { label: "Product List", link: "/productlist", active: true },
    { label: "Add Product", active: true },
  ];

  return (
    <div className="px-3 w-100">
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

      <div className="d-flex justify-content-between align-items-center pt-3">
        <div>
          <h4 className="H4-heading fw-bold">Add New Product</h4>
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
        <ButtonGlobal
          onClick={() => navigate("/productlist")}
          className="btn btn-outline-secondary d-flex align-items-center"
        >
          <BiArrowBack className="me-2" /> Back to List
        </ButtonGlobal>
      </div>

      <Card className="mt-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <InputField
                  label="Product Name"
                  type="text"
                  id="productname"
                  name="productname"
                  value={formData.productname}
                  onChange={handleChange}
                  isInvalid={!!fieldErrors.productname}
                  errorMessage={fieldErrors.productname}
                  required={true}
                />
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Category </Form.Label>
                  {categoriesLoading ? (
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading categories...
                    </div>
                  ) : categories.length > 0 ? (
                    <>
                      <Form.Select
                        name="categoryname"
                        value={formData.categoryname}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.categoryname}
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option
                            key={category.id}
                            value={category.categoryname}
                          >
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                      <p className="small mt-1">
                        Available categories: {categories.length}
                      </p>
                    </>
                  ) : (
                    <Alert variant="warning" className="py-2 mb-0">
                      No categories available. Please add categories first.
                    </Alert>
                  )}
                  {fieldErrors.categoryname && (
                    <div
                      className="text-danger mt-1"
                      style={{ textAlign: "left" }}
                    >
                      {fieldErrors.categoryname}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Subcategory</Form.Label>
                  {subcategoriesLoading ? (
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading subcategories...
                    </div>
                  ) : formData.categoryname ? (
                    subcategories.length > 0 ? (
                      <>
                        <Form.Select
                          name="subcategoryname"
                          value={formData.subcategoryname}
                          onChange={handleChange}
                          isInvalid={!!fieldErrors.subcategoryname}
                        >
                          <option value="">Select a subcategory</option>
                          {subcategories.map((subcat, index) => (
                            <option key={index} value={subcat}>
                              {subcat}
                            </option>
                          ))}
                        </Form.Select>
                        <p className="small mt-1">
                          Available subcategories: {subcategories.length}
                        </p>
                      </>
                    ) : (
                      <Form.Control
                        type="text"
                        name="subcategoryname"
                        value={formData.subcategoryname}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.subcategoryname}
                        placeholder="No subcategories available for this category"
                      />
                    )
                  ) : (
                    <Form.Control
                      type="text"
                      name="subcategoryname"
                      value={formData.subcategoryname}
                      onChange={handleChange}
                      isInvalid={!!fieldErrors.subcategoryname}
                      placeholder="Select a category first"
                      disabled
                    />
                  )}
                  {fieldErrors.subcategoryname && (
                    <div
                      className="text-danger mt-1"
                      style={{ textAlign: "left" }}
                    >
                      {fieldErrors.subcategoryname}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <InputField
                  label="SKU"
                  type="text"
                  id="SKU"
                  name="SKU"
                  value={formData.SKU}
                  onChange={handleChange}
                  isInvalid={!!fieldErrors.SKU}
                  errorMessage={fieldErrors.SKU}
                  required={true}
                />
              </Col>
              <Col md={4}>
                <InputField
                  label="Supplier SKU"
                  type="text"
                  id="supplierSKU"
                  name="supplierSKU"
                  value={formData.supplierSKU}
                  onChange={handleChange}
                  isInvalid={!!fieldErrors.supplierSKU}
                  errorMessage={fieldErrors.supplierSKU}
                />
              </Col>
              <Col md={2}>
                <InputField
                  label="Price"
                  type="text"
                  id="pro_price"
                  name="pro_price"
                  value={formData.pro_price}
                  onChange={handleNumericChange}
                  onKeyPress={handleKeyPress}
                  isInvalid={!!fieldErrors.pro_price}
                  errorMessage={fieldErrors.pro_price}
                  required={true}
                  placeholder="Enter price (e.g., 19.99)"
                />
              </Col>
              <Col md={2}>
                <InputField
                  label="Quantity"
                  type="text"
                  id="pro_quantity"
                  name="pro_quantity"
                  value={formData.pro_quantity}
                  onChange={handleNumericChange}
                  onKeyPress={handleKeyPress}
                  isInvalid={!!fieldErrors.pro_quantity}
                  errorMessage={fieldErrors.pro_quantity}
                  required={true}
                  placeholder="Enter quantity (whole numbers only)"
                />
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <TextAreaField
                  label="Description"
                  id="pro_description"
                  name="pro_description"
                  rows={3}
                  value={formData.pro_description}
                  onChange={handleChange}
                  error={fieldErrors.pro_description}
                />
              </Col>
              <Col md={6}>
                <TextAreaField
                  label="Specifications"
                  id="specification"
                  name="specification"
                  rows={3}
                  value={formData.specification}
                  onChange={handleChange}
                  error={fieldErrors.specification}
                />
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    Product Images (Select multiple images)
                  </Form.Label>
                  <FileInputField
                    label=""
                    className="ms-1 me-1"
                    id="images"
                    name="images"
                    onChange={handleImageUpload}
                    multiple={true}
                    accept="image/jpeg,image/png,image/gif"
                  />
                  {fieldErrors.images && (
                    <div
                      className="text-danger mt-1"
                      style={{ textAlign: "left" }}
                    >
                      {fieldErrors.images}
                    </div>
                  )}
                  <div className="d-flex flex-wrap mt-3 gap-2">
                    {formData.images.map((img, index) => (
                      <div
                        key={index}
                        className="position-relative"
                        style={{ width: "100px" }}
                      >
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Preview ${index + 1}`}
                          className="img-thumbnail"
                          style={{ height: "100px", objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          className="position-absolute top-0 end-0 btn btn-sm btn-danger"
                          onClick={() => removeImage(index)}
                          style={{ transform: "translate(50%, -50%)" }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <Form.Text className="text-muted">
                    Hold Ctrl/Cmd to select multiple images at once
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    Product Documentation (PDF, DOC, DOCX)
                  </Form.Label>
                  <FileInputField
                    label=""
                    className="ms-1 me-1"
                    id="attach_doc"
                    name="attach_doc"
                    onChange={handleFileUpload}
                  />
                  {fieldErrors.attach_doc && (
                    <div
                      className="text-danger mt-1"
                      style={{ textAlign: "left" }}
                    >
                      {fieldErrors.attach_doc}
                    </div>
                  )}
                  {formData.attach_doc && (
                    <div className="mt-2">
                      <span className="d-flex align-items-center">
                        <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                        <span>{formData.attach_doc.name}</span>
                      </span>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Card className="mb-4">
              <Card.Header className="bg-transparent">SEO Settings</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <InputField
                      label="Meta Title"
                      type="text"
                      id="metatitle"
                      name="metatitle"
                      value={formData.metatitle}
                      onChange={handleChange}
                      isInvalid={!!fieldErrors.metatitle}
                      errorMessage={fieldErrors.metatitle}
                    />
                  </Col>
                  <Col md={6}>
                    <InputField
                      label="Meta Keywords"
                      type="text"
                      id="metakeywords"
                      name="metakeywords"
                      value={formData.metakeywords}
                      onChange={handleChange}
                      isInvalid={!!fieldErrors.metakeywords}
                      errorMessage={fieldErrors.metakeywords}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <TextAreaField
                      label="Meta Description"
                      id="metadescription"
                      name="metadescription"
                      rows={2}
                      value={formData.metadescription}
                      onChange={handleChange}
                      error={fieldErrors.metadescription}
                    />
                  </Col>
                  <Col md={6}>
                    <InputField
                      label="Meta Robots"
                      type="text"
                      id="metarobot"
                      name="metarobot"
                      value={formData.metarobot}
                      onChange={handleChange}
                      isInvalid={!!fieldErrors.metarobot}
                      errorMessage={fieldErrors.metarobot}
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-end gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => navigate("/productlist")}
              >
                Cancel
              </Button>
              <ButtonGlobal
                className="btn button-global"
                type="submit"
                disabled={
                  loading || categoriesLoading || categories.length === 0
                }
                text={
                  loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Adding Product...
                    </>
                  ) : (
                    "Add Product"
                  )
                }
              />
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AddProduct;