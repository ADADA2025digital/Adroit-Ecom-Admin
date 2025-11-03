import React, { useEffect, useState } from "react";
import "../Assets/Styles/Style.css";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import 'datatables.net-responsive-dt';
import "datatables.net";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Modal, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {sampleData}from "../Constants/Data";
import "react-data-table-component";

const DataTable = () => {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    office: "",
    age: "",
    startDate: "",
    salary: "",
  });

  useEffect(() => {
    setData(sampleData);
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const table = $("#dataTable").DataTable({
        data: data,
        destroy: true,
        columns: [
          { title: "ID", data: "id" },
          { title: "Name", data: "name" },
          { title: "Position", data: "position" },
          { title: "Office", data: "office" },
          { title: "Age", data: "age" },
          { title: "Start Date", data: "startDate" },
          { title: "Salary", data: "salary" },
          {
            title: "Action",
            data: null,
            render: function (data, type, row) {
              return `
                <i class="bi bi-pencil-square edit-icon" data-id="${row.id}" style="cursor: pointer; color: green; margin-right: 10px;"></i>
                <i class="bi bi-trash delete-icon" data-id="${row.id}" style="cursor: pointer; color: red;"></i>
              `;
            },
          },
        ],
      });

      $("#dataTable tbody").on("click", ".delete-icon", function () {
        const id = $(this).data("id");
        setSelectedId(id);
        setEditMode(false);
        setShowModal(true);
      });

      $("#dataTable tbody").on("click", ".edit-icon", function () {
        const id = $(this).data("id");
        const rowData = data.find((item) => item.id === id);
        setSelectedId(id);
        setFormData({
          name: rowData.name,
          position: rowData.position,
          office: rowData.office,
          age: rowData.age,
          startDate: rowData.startDate,
          salary: rowData.salary,
        });
        setEditMode(true);
        setShowModal(true);
      });

      return () => {
        table.destroy();
      };
    }
  }, [data]);

  const handleDelete = () => {
    setData((prevData) => prevData.filter((item) => item.id !== selectedId));
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === selectedId ? { ...item, ...formData } : item
      )
    );
    setShowModal(false);
  };

  return (
    <div className="px-3 w-100">
      <h4
        className="py-3 fw-bold"
        style={{ color: "#7a70ba", borderBottom: "2px dotted #7a70ba" }}
      >
        Sample Datatable
      </h4>{" "}
      <div className="table-responsive ">
        <table id="dataTable" className="display"></table>
      </div>
      

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode ? "Edit Entry" : "Confirm Delete"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editMode ? (
            <Form>
              <Form.Group controlId="formName">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group controlId="formPosition" className="mt-3">
                <Form.Label>Position</Form.Label>
                <Form.Control
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group controlId="formOffice" className="mt-3">
                <Form.Label>Office</Form.Label>
                <Form.Control
                  type="text"
                  name="office"
                  value={formData.office}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group controlId="formAge" className="mt-3">
                <Form.Label>Age</Form.Label>
                <Form.Control
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group controlId="formStartDate" className="mt-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group controlId="formSalary" className="mt-3">
                <Form.Label>Salary</Form.Label>
                <Form.Control
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                />
              </Form.Group>
            </Form>
          ) : (
            "Are you sure you want to delete this entry?"
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {editMode ? "Cancel" : "No"}
          </Button>
          {editMode ? (
            <Button
              onClick={handleSave}
              style={{ backgroundColor: "#7a70ba", border: "none" }}
            >
              Save
            </Button>
          ) : (
            <Button variant="danger" onClick={handleDelete}>
              Yes
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DataTable;