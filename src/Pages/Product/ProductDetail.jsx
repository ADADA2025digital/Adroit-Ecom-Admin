import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Breadcrumb,
  Button,
  Row,
  Col,
  Card,
  Image,
  Badge,
} from "react-bootstrap";
import { BiArrowBack } from "react-icons/bi";
import { BsFilePdf } from "react-icons/bs";


const ProductDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;

  const [mainImage, setMainImage] = useState(
    product.images?.[0]?.imgurl || null
  );

  if (!product) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center min-vh-50">
          <div className="text-center p-5 bg-light rounded-3 shadow-sm">
            <p className="fs-5 mb-4">
              Product not found. Please go back to the product list.
            </p>
            <Button variant="primary" onClick={() => navigate("/productlist")}>
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Product", href: "#", active: true },
    { label: "Product List", href: "#", active: true },
    { label: product.productname, href: "#", active: true },
  ];

  // Parse subcategories if they exist
  const subcategories = product.category?.subcategories
    ? JSON.parse(product.category.subcategories)
    : [];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Product Details</h4>
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
          onClick={() => navigate("/productlist")}
          className="btn-outline-secondary"
        >
          <BiArrowBack className="me-2" /> Back to List
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
        <Card.Body className="p-4">
          <Row>
            {/* Product Images */}
            <Col md={5} lg={4}>
              <div className="mb-4">
                {product.images && product.images.length > 0 ? (
                  <div className="text-center">
                    <div
                      className="bg-tranparent rounded-3 p-3 mb-3"
                      style={{ height: "300px" }}
                    >
                      <Image
                        src={mainImage}
                        alt={product.productname}
                        fluid
                        className="rounded h-100"
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <div className="d-flex mt-3 overflow-auto pb-2">
                      {product.images.map((img) => (
                        <div
                          key={img.id}
                          className="flex-shrink-0 me-2"
                          onClick={() => setMainImage(img.imgurl)} // 🔹 update main image on click
                          style={{ cursor: "pointer" }}
                        >
                          <Image
                            src={img.imgurl}
                            alt="Thumbnail"
                            thumbnail
                            style={{
                              height: "80px",
                              width: "80px",
                              objectFit: "cover",
                              border:
                                img.imgurl === mainImage
                                  ? "2px solid #0d6efd"
                                  : "1px solid #dee2e6",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-5 border rounded-3 bg-light">
                    <i className="bi bi-image fs-1 text-muted"></i>
                    <p className="mt-2 text-muted">No images available</p>
                  </div>
                )}
              </div>
            </Col>

            {/* Product Details - Adjusted padding */}
            <Col md={7} lg={8}>
              <div className="ps-md-3 ps-lg-4">
                {" "}
                {/* Reduced left padding on medium screens */}
                <h3 className="mb-3 fw-bold ">
                  {product.productname}
                </h3>
                <div className="d-flex align-items-center mb-4">
                  <h4 className="text-primary mb-0 fw-bold">
                    ${parseFloat(product.pro_price).toFixed(2)}
                  </h4>
                  <Badge
                    bg={product.pro_quantity > 0 ? "success" : "danger"}
                    className="ms-3 px-3 py-2"
                  >
                    {product.pro_quantity > 0
                      ? `In Stock: ${product.pro_quantity}`
                      : "Out of Stock"}
                  </Badge>
                </div>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <div className="p-3 rounded-3 h-100">
                      <h6 className=" small mb-1">Product ID</h6>
                      <p className="mb-0 fw-medium">{product.product_id}</p>
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className=" p-3 rounded-3 h-100">
                      <h6 className=" small mb-1">SKU</h6>
                      <p className="mb-0 fw-medium">{product.SKU}</p>
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className=" p-3 rounded-3 h-100">
                      <h6 className=" small mb-1">Supplier SKU</h6>
                      <p className="mb-0 fw-medium">{product.supplierSKU}</p>
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className=" p-3 rounded-3 h-100">
                      <h6 className="small mb-1">Category</h6>
                      <p className="mb-0 fw-medium">
                        {product.category?.categoryname || "N/A"} (
                        {product.category_id})
                      </p>
                    </div>
                  </Col>
                </Row>
                <div className="mb-4">
                  <h5 className="border-bottom pb-2 mb-3 fw-semibold">
                    Description
                  </h5>
                  <p className="lh-lg mb-0">
                    {product.pro_description}
                  </p>{" "}
                  {/* Removed bottom margin */}
                </div>
                <div className="mb-4">
                  <h5 className="border-bottom pb-2 mb-3 fw-semibold">
                    Specifications
                  </h5>
                  <p className=" lh-lg mb-0">
                    {product.specification}
                  </p>{" "}
                  {/* Removed bottom margin */}
                </div>
                {subcategories.length > 0 && (
                  <div className="mb-4">
                    <h5 className="border-bottom pb-2 mb-3 fw-semibold">
                      Subcategories
                    </h5>
                    <div className="d-flex flex-wrap gap-2">
                      <p className="lh-lg mb-0">
                        {product.subcategory}
                      </p>{" "}
                    </div>
                  </div>
                )}
                {product.attach_doc && (
                  <div className="mb-4">
                    <h5 className="border-bottom pb-2 mb-3 fw-semibold">
                      Documentation
                    </h5>
                    <a
                      href={product.attach_doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-inline-flex align-items-center text-decoration-none p-3 bg-light rounded-3"
                    >
                      <BsFilePdf className="text-danger me-2" size={24} />
                      <span className="fw-medium">
                        View Product Documentation
                      </span>
                    </a>
                  </div>
                )}
                <div className="mt-4 pt-3 border-top">
                  <small className="last">
                    <span className="d-block d-md-inline-block mb-1 mb-md-0">
                      <strong>Created:</strong>{" "}
                      {new Date(product.created_at).toLocaleString()}
                    </span>
                    <span className="d-none d-md-inline mx-2">|</span>
                    <span className="d-block d-md-inline-block">
                      <strong>Last Updated:</strong>{" "}
                      {new Date(product.updated_at).toLocaleString()}
                    </span>
                  </small>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProductDetail;
