import React, { useEffect, useState } from "react";
import "../../Assets/Styles/Style.css";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "datatables.net-responsive-dt";
import "datatables.net";

import {
  Modal,
  Form,
  Breadcrumb,
  Spinner,
  Alert,
  Row,
  Col,
  Card,
  Badge,
  Button,
  OverlayTrigger,
  Tooltip,
  ToastContainer,
  Toast,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import ButtonGlobal from "../../Components/Button";
import api from "../../config/axiosConfig";
import { getCookie } from "../../config/utils";
import InputField from "../../Components/InputField";
import FileInputField from "../../Components/FileInputField";
import TextAreaField from "../../Components/TextAreaField";

const ProductList = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
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
    existingImages: [],
    metatitle: "",
    metadescription: "",
    metakeywords: "",
    metarobot: "",
  });

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState("success");
  const [toastMessage, setToastMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  // Define dynamic validation rules configuration
  const validationRules = {
    productname: {
      pattern: /^[a-zA-Z0-9\s\-_]{3,100}$/,
      message: "Product name must be 3-100 characters (letters, numbers, spaces, hyphens, underscores)",
      required: true
    },
    SKU: {
      pattern: /^[a-zA-Z0-9\-_]{4,50}$/,
      message: "SKU must be 4-50 alphanumeric characters with hyphens/underscores",
      required: true
    },
    supplierSKU: {
      pattern: /^[a-zA-Z0-9\-_]{0,50}$/,
      message: "Supplier SKU must be up to 50 alphanumeric characters",
      required: false
    },
    pro_price: {
      pattern: /^\d+(\.\d{1,2})?$/,
      message: "Price must be a positive number with up to 2 decimal places",
      required: true
    },
    pro_quantity: {
      pattern: /^\d+$/,
      message: "Quantity must be a positive whole number",
      required: true
    },
    categoryname: {
      required: true,
      message: "Category is required"
    },
    metatitle: {
      pattern: /^.{0,60}$/,
      message: "Meta title should be under 60 characters",
      required: false
    },
    metakeywords: {
      pattern: /^[a-zA-Z0-9,\s\-_]{0,200}$/,
      message: "Keywords should be comma-separated and under 200 characters",
      required: false
    },
    pro_description: {
      maxLength: 2000,
      message: "Description cannot exceed 2000 characters",
      required: false
    },
    specification: {
      maxLength: 1000,
      message: "Specifications cannot exceed 1000 characters",
      required: false
    }
  };

  // Dynamic validation function
  const dynamicValidateForm = () => {
    const errors = {};

    // Validate each field based on validationRules
    Object.keys(validationRules).forEach(fieldName => {
      const rule = validationRules[fieldName];
      const value = formData[fieldName];
      
      // Check required fields
      if (rule.required && (!value || value.toString().trim() === "")) {
        errors[fieldName] = `${fieldName.replace(/_/g, ' ')} is required`;
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
        case 'pro_price':
          if (value && parseFloat(value) <= 0) {
            errors[fieldName] = "Price must be greater than 0";
          }
          break;
        case 'pro_quantity':
          if (value && parseInt(value) < 0) {
            errors[fieldName] = "Quantity cannot be negative";
          }
          break;
        default:
          break;
      }
    });

    // Special validation for images
    if (formData.existingImages.length === 0 && formData.images.length === 0) {
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
      errors[name] = `${name.replace(/_/g, ' ')} is required`;
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
      case 'pro_price':
        if (value && parseFloat(value) <= 0) {
          errors[name] = "Price must be greater than 0";
        }
        break;
      case 'pro_quantity':
        if (value && parseInt(value) < 0) {
          errors[name] = "Quantity cannot be negative";
        }
        break;
      default:
        break;
    }

    return errors;
  };

  // Enhanced handleChange with real-time validation
  const handleChangeWithValidation = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({ 
      ...prev, 
      ...fieldError 
    }));
  };

  // Show toast function
  const showToastMessage = (variant, message) => {
    setToastVariant(variant);
    setToastMessage(message);
    setShowToast(true);
  };

  // Fetch products and categories from API
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const token = getCookie("token") || localStorage.getItem("token");

      // Fetch products
      const productsResponse = await api.get("/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch categories
      const categoriesResponse = await api.get("/getcategory", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (productsResponse.data.success) {
        // Destroy existing DataTable if it exists
        if ($.fn.DataTable.isDataTable("#dataTable")) {
          $("#dataTable").DataTable().destroy();
        }

        const formattedProducts = productsResponse.data.products.map(
          (product, index) => ({
            index: index + 1,
            ...product,
            images: product.images
              ? product.images.map((img) => ({
                  id: img.id,
                  imgurl: img.imgurl,
                }))
              : [],
          })
        );

        setProducts(formattedProducts);
        setError(null);
      } else {
        setError("Failed to fetch products");
      }

      // Process categories
      if (categoriesResponse.data) {
        const processedCategories = categoriesResponse.data.map((category) => {
          try {
            let subcats = [];

            if (category.subcategories) {
              if (typeof category.subcategories === "string") {
                subcats = JSON.parse(category.subcategories);
              } else if (Array.isArray(category.subcategories)) {
                subcats = category.subcategories;
              }
            }

            return {
              id: category.id,
              categoryname: category.categoryname,
              subcategories: subcats,
            };
          } catch (e) {
            console.error("Error parsing subcategories:", e, category);
            return {
              id: category.id,
              categoryname: category.categoryname,
              subcategories: [],
            };
          }
        });

        setCategories(processedCategories);
      }

      setLastRefreshTime(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!formData.categoryname) {
      setSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategoryname: "" }));
      return;
    }

    const selectedCategory = categories.find(
      (cat) => cat.categoryname === formData.categoryname
    );

    if (selectedCategory && selectedCategory.subcategories) {
      setSubcategories(selectedCategory.subcategories);
      if (!editMode) {
        setFormData((prev) => ({
          ...prev,
          subcategoryname: "",
        }));
      }
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryname, categories, editMode]);

  // Initialize DataTable
  useEffect(() => {
    if (products.length > 0 && !loading) {
      try {
        if ($.fn.DataTable.isDataTable("#dataTable")) {
          $("#dataTable").DataTable().destroy();
        }

        const table = $("#dataTable").DataTable({
          data: products,
          destroy: true,
          columns: [
            {
              title: "ID",
              data: "index",
              className: "text-center",
            },
            {
              title: "Image",
              data: "images",
              render: function (data, type, row) {
                if (data && data.length > 0 && data[0].imgurl) {
                  return `<img src="${data[0].imgurl}" alt="Product" style="width: 50px; height: 50px; object-fit: cover;" />`;
                }
                return '<div style="width: 50px; height: 50px; background: #eee; display: flex; align-items: center; justify-content: center;"><i class="bi bi-image"></i></div>';
              },
            },
            {
              title: "Name",
              data: "productname",
              render: function (data) {
                return data || "N/A";
              },
            },
            {
              title: "Price",
              data: "pro_price",
              render: function (data) {
                return data ? `$${parseFloat(data).toFixed(2)}` : "$0.00";
              },
            },
            {
              title: "Stock",
              data: "pro_quantity",
              render: function (data) {
                return data || "0";
              },
            },
            {
              title: "Category",
              data: "category",
              render: function (data) {
                return data && data.categoryname ? data.categoryname : "N/A";
              },
            },
            {
              title: "SKU",
              data: "SKU",
              render: function (data) {
                return data || "N/A";
              },
            },
            {
              title: "Document",
              data: "attach_doc",
              className: "text-center",
              render: function (data) {
                if (data) {
                  return `<a href="${data}" target="_blank" class="btn btn-sm  doc-btn">
                    <i class="bi bi-file-earmark-pdf"></i> View
                  </a>`;
                }
                return "No document";
              },
            },
            {
              title: "Action",
              className: "text-center",
              data: null,
              render: function (data, type, row) {
                return `
                  <div class="d-flex justify-content-center">
                    <i class="bi bi-eye view-icon" data-id="${row.id}" "></i>
                    <i class="bi bi-pencil-square edit-icon" data-id="${row.id}" ></i>
                    <i class="bi bi-trash delete-icon"
                      data-id="${row.id}"
                      data-product-id="${row.product_id}"></i>
                  </div>
                `;
              },
            },
          ],
          responsive: false,
          scrollX: true,
          columnDefs: [
            { targets: [1, 8], orderable: false, searchable: false },
          ],
          createdRow: function (row, data, dataIndex) {
            $(row).attr("data-id", data.id);
          },
          language: {
            emptyTable: "No products found",
          },
          order: [[0, "asc"]],
        });

        // Delete handler
        $("#dataTable tbody").on("click", ".delete-icon", function () {
          const id = $(this).data("id");
          const productId = $(this).data("product-id");
          setSelectedId(id);
          setSelectedProductId(productId);
          setEditMode(false);
          setShowModal(true);
        });

        // View handler
        $("#dataTable tbody").on("click", ".view-icon", function () {
          const id = $(this).data("id");
          const product = products.find((item) => item.id === id);
          const slug = product.slug || product.productname.toLowerCase().replace(/\s+/g, "-");

          navigate(`/productdetail/${slug}`, {
            state: { product },
          });
        });

        // Edit handler
        $("#dataTable tbody").on("click", ".edit-icon", function () {
          const id = $(this).data("id");
          const product = products.find((item) => item.id === id);

          setSelectedId(id);
          setSelectedProductId(product.product_id);

          const subcategoryName =
            product.subcategory ||
            product.subcategoryname ||
            (product.subcategory && product.subcategory.subcategoryname) ||
            "";

          setFormData({
            productname: product.productname,
            pro_description: product.pro_description || "",
            specification: product.specification || "",
            SKU: product.SKU,
            supplierSKU: product.supplierSKU || "",
            pro_price: product.pro_price,
            pro_quantity: product.pro_quantity,
            categoryname: product.category?.categoryname || "",
            subcategoryname: subcategoryName,
            attach_doc: product.attach_doc || null,
            images: [],
            existingImages: product.images || [],
            metatitle: product.metadata?.metatitle || "",
            metadescription: product.metadata?.metadescription || "",
            metakeywords: product.metadata?.metakeywords || "",
            metarobot: product.metadata?.metarobot || "",
          });

          setEditMode(true);
          setShowModal(true);
          setFieldErrors({});
        });
      } catch (err) {
        console.error("DataTable initialization error:", err);
        setError("Failed to initialize table");
      }
    }
  }, [products, navigate, loading]);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = getCookie("token") || localStorage.getItem("token");
      const response = await api.delete(
        `/products/deleteproduct/${selectedProductId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        await fetchData();
        setShowModal(false);
        setError(null);
        showToastMessage("success", "Product deleted successfully");
      } else {
        showToastMessage(
          "danger",
          response.data.message || "Failed to delete product"
        );
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToastMessage(
        "danger",
        err.response?.data?.message || "Failed to delete product"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // New function to handle numeric input changes with validation
  const handleNumericChange = (e) => {
    const { name, value } = e.target;

    let filteredValue = value;

    if (name === "pro_quantity") {
      filteredValue = value.replace(/[^0-9]/g, "");
      filteredValue = filteredValue.replace(/^0+/, '');
      if (filteredValue === '') filteredValue = '0';
    } else if (name === "pro_price") {
      filteredValue = value
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1")
        .replace(/^0+(\d)/, "$1");
      
      if (filteredValue.startsWith('.')) {
        filteredValue = '0' + filteredValue;
      }
      
      const decimalParts = filteredValue.split('.');
      if (decimalParts[1] && decimalParts[1].length > 2) {
        filteredValue = decimalParts[0] + '.' + decimalParts[1].substring(0, 2);
      }
    }

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    // Validate the field in real-time
    const fieldError = validateField(name, filteredValue);
    setFieldErrors((prev) => ({ ...prev, ...fieldError }));
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

  // Helper to check if form is valid
  const isFormValid = () => {
    return !dynamicValidateForm();
  };

  // Helper to get validation summary
  const getValidationSummary = () => {
    const errors = dynamicValidateForm();
    if (!errors) return { isValid: true, errors: null };
    
    return {
      isValid: false,
      errors,
      errorCount: Object.keys(errors).length,
      errorFields: Object.keys(errors)
    };
  };

  const deleteImage = async (productId, imageId) => {
    try {
      const token = getCookie("token") || localStorage.getItem("token");
      const response = await api.delete(
        `/products/${productId}/images/${imageId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to delete image");
      }
    } catch (err) {
      console.error("Delete image error:", err);
      throw err;
    }
  };

  // Remove the old validateForm function since we're using dynamicValidateForm

  const handleSave = async () => {
    try {
      // Use dynamic validation
      const validationErrors = dynamicValidateForm();
      if (validationErrors) {
        setFieldErrors(validationErrors);
        showToastMessage("danger", "Please fix the validation errors");
        return;
      }

      setLoading(true);
      setError(null);

      const token = getCookie("token") || localStorage.getItem("token");

      const formDataToSend = new FormData();

      // Required fields
      formDataToSend.append("productname", formData.productname);
      formDataToSend.append("pro_price", formData.pro_price);
      formDataToSend.append("pro_quantity", formData.pro_quantity);
      formDataToSend.append("SKU", formData.SKU);
      formDataToSend.append("categoryname", formData.categoryname);
      formDataToSend.append("subcategoryname", formData.subcategoryname);

      // Optional fields
      if (formData.pro_description)
        formDataToSend.append("pro_description", formData.pro_description);
      if (formData.specification)
        formDataToSend.append("specification", formData.specification);
      if (formData.supplierSKU)
        formDataToSend.append("supplierSKU", formData.supplierSKU);
      if (formData.metatitle)
        formDataToSend.append("metatitle", formData.metatitle);
      if (formData.metadescription)
        formDataToSend.append("metadescription", formData.metadescription);
      if (formData.metakeywords)
        formDataToSend.append("metakeywords", formData.metakeywords);
      if (formData.metarobot)
        formDataToSend.append("metarobot", formData.metarobot);

      // Document
      if (formData.attach_doc instanceof File) {
        formDataToSend.append("attach_doc", formData.attach_doc);
      } else if (formData.attach_doc === null) {
        formDataToSend.append("attach_doc", "");
      }

      // Images
      if (formData.images.length > 0) {
        formData.images.forEach((image) => {
          if (image instanceof File) {
            formDataToSend.append("images[]", image);
          }
        });
      }

      // Existing images
      formDataToSend.append(
        "existingImages",
        JSON.stringify(formData.existingImages.map((img) => img.imgurl || img))
      );

      // API call
      const response = await api.post(
        `/updateproduct/${selectedId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const isSuccess =
        response.data.success === true ||
        response.data.status === 200 ||
        response.status === 200;

      if (isSuccess) {
        try {
          await fetchData();
        } catch (fetchError) {
          console.error("Error refreshing data:", fetchError);
        }

        setShowModal(false);
        setFormData({
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
          existingImages: [],
          metatitle: "",
          metadescription: "",
          metakeywords: "",
          metarobot: "",
        });
        setFieldErrors({});

        showToastMessage(
          "success",
          response.data.message || "Product updated successfully!"
        );
      } else {
        showToastMessage(
          "danger",
          response.data.message || "Failed to update product"
        );
      }
    } catch (err) {
      console.error("Detailed error updating product:", err);

      if (err.response?.status === 422) {
        const errors = err.response.data.errors || {};
        const formattedErrors = {};
        Object.entries(errors).forEach(([field, messages]) => {
          formattedErrors[field] = Array.isArray(messages)
            ? messages.join(", ")
            : messages;
        });
        setFieldErrors(formattedErrors);

        const errorMessages = Object.values(formattedErrors).join(", ");
        showToastMessage("danger", `Validation errors: ${errorMessages}`);
      } else {
        showToastMessage(
          "danger",
          err.response?.data?.message ||
            "Failed to update product. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024;
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
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

    if (fieldErrors.images) {
      setFieldErrors((prev) => ({ ...prev, images: null }));
    }
  };

  const removeImage = async (index, isExisting = false) => {
    if (isExisting) {
      const imageToDelete = formData.existingImages[index];
      const imageId = imageToDelete.id;

      try {
        setLoading(true);
        const result = await deleteImage(selectedProductId, imageId);

        setFormData((prev) => {
          const newExistingImages = [...prev.existingImages];
          newExistingImages.splice(index, 1);
          return {
            ...prev,
            existingImages: newExistingImages,
          };
        });

        showToastMessage(
          "success",
          result.message || "Image deleted successfully"
        );
      } catch (err) {
        showToastMessage(
          "danger",
          err.response?.data?.message || "Failed to delete image"
        );
      } finally {
        setLoading(false);
      }
    } else {
      setFormData((prev) => {
        const newImages = [...prev.images];
        newImages.splice(index, 1);
        return {
          ...prev,
          images: newImages,
        };
      });
    }

    if (fieldErrors.images) {
      setFieldErrors((prev) => ({ ...prev, images: null }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      showToastMessage(
        "danger",
        "Invalid file type. Please upload PDF, DOC, or DOCX files."
      );
      return;
    }

    if (file.size > maxSize) {
      showToastMessage("danger", "File size too large. Maximum 10MB allowed.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      attach_doc: file,
    }));
  };

  const breadcrumbItems = [
    { label: "Product", link: "/product", active: true },
    { label: "ProductList", link: "/productlist", active: true },
  ];

  if (loading && products.length === 0) {
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

  if (error && products.length === 0) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Products</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      {/* Toast Container */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={5000}
          autohide
          bg={toastVariant}
        >
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Product List</h4>
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
            text="Add Product"
            className="btn button-global"
            onClick={() => navigate("/addproduct")}
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

      {error && (
        <Alert
          variant={error.includes("success") ? "success" : "danger"}
          className="mt-3"
          onClose={() => setError(null)}
          dismissible
        >
          {error}
        </Alert>
      )}

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive mt-1 p-3 rounded-3 shadow">
            {loading && products.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : (
              <table
                id="dataTable"
                className="table table-striped table-hover   custom-data-table "
              ></table>
            )}
          </div>
        </div>
      </div>


      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size={editMode ? "xl" : "m"}
        centered
        dialogClassName="modal-dialog-scrollable"
      >
        <Modal.Header
          closeButton
          className={`${editMode ? "bg-transparent" : "bg-transparent"}`}
        >
          <Modal.Title>
            {editMode ? "Edit Product" : "Confirm Deletion"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {editMode ? (
            <Form>
              <Row>
                <Col md={8}>
                  <Card className="mb-4">
                    <Card.Header className="bg-transparent">
                      <h6 className="mb-0">Basic Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <InputField
                            label="Product Name"
                            type="text"
                            name="productname"
                            value={formData.productname}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.productname}
                            errorMessage={fieldErrors.productname}
                            required={true}
                            placeholder="Enter product name"
                          />
                        </Col>
                        <Col md={6}>
                          <InputField
                            label="SKU"
                            type="text"
                            name="SKU"
                            value={formData.SKU}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.SKU}
                            errorMessage={fieldErrors.SKU}
                            required={true}
                            placeholder="Product SKU"
                          />
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Category <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              name="categoryname"
                              value={formData.categoryname}
                              onChange={handleChange}
                              isInvalid={!!fieldErrors.categoryname}
                              required
                            >
                              <option value="">Select Category</option>
                              {categories.map((category) => (
                                <option
                                  key={category.id}
                                  value={category.categoryname}
                                >
                                  {category.categoryname}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {fieldErrors.categoryname}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Subcategory</Form.Label>
                            {formData.categoryname ? (
                              subcategories.length > 0 ? (
                                <Form.Select
                                  name="subcategoryname"
                                  value={formData.subcategoryname}
                                  onChange={handleChange}
                                >
                                  <option value="">Select Subcategory</option>
                                  {subcategories.map((subcat, index) => (
                                    <option key={index} value={subcat}>
                                      {subcat}
                                    </option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <InputField
                                  type="text"
                                  name="subcategoryname"
                                  value={formData.subcategoryname}
                                  onChange={handleChange}
                                  placeholder="Enter subcategory"
                                />
                              )
                            ) : (
                              <InputField
                                type="text"
                                name="subcategoryname"
                                value={formData.subcategoryname}
                                onChange={handleChange}
                                placeholder="Select a category first"
                                disabled
                              />
                            )}
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <InputField
                            label="Price ($)"
                            type="text"
                            name="pro_price"
                            value={formData.pro_price}
                            onChange={handleNumericChange}
                            onKeyPress={handleKeyPress}
                            isInvalid={!!fieldErrors.pro_price}
                            errorMessage={fieldErrors.pro_price}
                            required={true}
                            placeholder="0.00"
                          />
                        </Col>

                        <Col md={6}>
                          <InputField
                            label="Quantity"
                            type="text"
                            name="pro_quantity"
                            value={formData.pro_quantity}
                            onChange={handleNumericChange}
                            onKeyPress={handleKeyPress}
                            isInvalid={!!fieldErrors.pro_quantity}
                            errorMessage={fieldErrors.pro_quantity}
                            required={true}
                            placeholder="0"
                          />
                        </Col>

                        <Col md={6}>
                          <InputField
                            label="Supplier SKU"
                            type="text"
                            name="supplierSKU"
                            value={formData.supplierSKU}
                            onChange={handleChange}
                            placeholder="Optional supplier SKU"
                          />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <Card className="mb-4">
                    <Card.Header className="bg-transparent">
                      <h6 className="mb-0">Description & Specifications</h6>
                    </Card.Header>
                    <Card.Body>
                      <TextAreaField
                        label="Product Description"
                        name="pro_description"
                        rows={3}
                        value={formData.pro_description}
                        onChange={handleChange}
                        placeholder="Describe the product features and benefits"
                      />

                      <TextAreaField
                        label="Specifications"
                        name="specification"
                        rows={3}
                        value={formData.specification}
                        onChange={handleChange}
                        placeholder="Technical specifications, dimensions, etc."
                      />
                    </Card.Body>
                  </Card>

                  <Card className="mb-4">
                    <Card.Header className="bg-transparent">
                      <h6 className="mb-0">SEO Metadata</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <InputField
                            label="Meta Title"
                            type="text"
                            name="metatitle"
                            value={formData.metatitle}
                            onChange={handleChange}
                            placeholder="SEO title tag"
                          />
                        </Col>
                        <Col md={6}>
                          <InputField
                            label="Meta Robots"
                            type="text"
                            name="metarobot"
                            value={formData.metarobot}
                            onChange={handleChange}
                            placeholder="index, follow, etc."
                          />
                        </Col>
                        <Col md={12}>
                          <TextAreaField
                            label="Meta Description"
                            name="metadescription"
                            rows={2}
                            value={formData.metadescription}
                            onChange={handleChange}
                            placeholder="SEO description for search engines"
                          />
                        </Col>
                        <Col md={12}>
                          <InputField
                            label="Meta Keywords"
                            type="text"
                            name="metakeywords"
                            value={formData.metakeywords}
                            onChange={handleChange}
                            placeholder="Comma-separated keywords"
                          />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="mb-4">
                    <Card.Header className="bg-transparent">
                      <h6 className="mb-0">Media</h6>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Product Images <span className="text-danger">*</span>
                        </Form.Label>
                        {fieldErrors.images && (
                          <div className="text-danger small mb-2">
                            {fieldErrors.images}
                          </div>
                        )}
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          {/* Display existing images */}

                          {formData.existingImages.map((img, index) => (
                            <div
                              key={`existing-${img.id || index}`} // Use ID if available
                              className="position-relative"
                            >
                              <img
                                src={img.imgurl || img}
                                alt={`Product ${index + 1}`}
                                className="img-thumbnail"
                                style={{
                                  width: "80px",
                                  height: "80px",
                                  objectFit: "cover",
                                }}
                              />
                              <Button
                                variant="danger"
                                className="position-absolute top-0 end-0 btn-sm"
                                onClick={() => removeImage(index, true)} // Pass true for existing images
                                style={{
                                  transform: "translate(50%, -50%)",
                                  borderRadius: "50%",
                                  width: "24px",
                                  height: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: 0,
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}

                          {/* Display new images */}
                          {formData.images.map((img, index) => (
                            <div
                              key={`new-${index}`}
                              className="position-relative"
                            >
                              <img
                                src={URL.createObjectURL(img)}
                                alt={`Preview ${index + 1}`}
                                className="img-thumbnail"
                                style={{
                                  width: "80px",
                                  height: "80px",
                                  objectFit: "cover",
                                }}
                              />
                              <Button
                                variant="danger"
                                className="position-absolute top-0 end-0 btn-sm"
                                onClick={() => removeImage(index, false)}
                                style={{
                                  transform: "translate(50%, -50%)",
                                  borderRadius: "50%",
                                  width: "24px",
                                  height: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: 0,
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}

                          {formData.existingImages.length === 0 &&
                            formData.images.length === 0 && (
                              <div className="text-center text-muted py-3 border rounded">
                                <i className="bi bi-image fs-1 d-block mb-2"></i>
                                No images uploaded
                              </div>
                            )}
                        </div>
                        <FileInputField
                          label={
                            <>
                              <i className="bi bi-upload me-2 "></i>
                              Upload Images
                            </>
                          }
                          id="images"
                          name="images"
                          onChange={handleImageUpload}
                          multiple
                          accept="image/*"
                          className="w-100 "
                          buttonVariant="outline-primary"
                        />
                        <Form.Text className="text-muted">
                          JPG, PNG or GIF (Max 5MB each)
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Product Document</Form.Label>
                        {formData.attach_doc ? (
                          <div className="d-flex align-items-center justify-content-between p-2 border rounded">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-file-earmark-pdf fs-3 text-danger me-2"></i>
                              <div>
                                <div className="fw-semibold">
                                  {formData.attach_doc instanceof File
                                    ? formData.attach_doc.name
                                    : "Current Document"}
                                </div>
                                <small className="text-muted">
                                  {formData.attach_doc instanceof File
                                    ? `${(
                                        formData.attach_doc.size / 1024
                                      ).toFixed(2)} KB`
                                    : "Previously uploaded"}
                                </small>
                              </div>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  attach_doc: null,
                                }))
                              }
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center text-muted py-4 border rounded">
                            <i className="bi bi-file-earmark-pdf fs-1 d-block mb-2"></i>
                            No document attached
                          </div>
                        )}
                        <FileInputField
                          label={
                            <>
                              <i className="bi bi-upload me-2"></i>
                              Upload Document
                            </>
                          }
                          id="attach_doc"
                          name="attach_doc"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx"
                          className="w-100 mt-2"
                          buttonVariant="outline-secondary"
                        />
                        <Form.Text className="text-muted">
                          PDF, DOC or DOCX (Max 10MB)
                        </Form.Text>
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  <Card className="mb-4">
                    <Card.Header className="bg-transparent">
                      <h6 className="mb-0">Product Status</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">Inventory Status</div>
                          <Badge
                            bg={
                              formData.pro_quantity > 0 ? "success" : "danger"
                            }
                          >
                            {formData.pro_quantity > 0
                              ? "In Stock"
                              : "Out of Stock"}
                          </Badge>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold">Product ID</div>
                          <code>{selectedProductId}</code>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Form>
          ) : (
            <div className="text-center py-3">
              <h5>Confirm Deletion</h5>
              <p>Are you sure you want to delete this product?</p>
              <div className="border p-3 rounded bg-transparent">
                <p className=" small mb-0">ID: {selectedId}</p>
              </div>
              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  {error}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {editMode ? "Cancel" : "Keep Product"}
          </Button>
          {editMode ? (
            <Button
              className="button-global"
              variant="primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Saving Changes...
                </>
              ) : (
                "Save"
              )}
            </Button>
          ) : (
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Deleting...
                </>
              ) : (
                "Yes, Delete Product"
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductList;
