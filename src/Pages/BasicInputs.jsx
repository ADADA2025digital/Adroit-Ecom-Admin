import React, { useState } from "react";
import "../Assets/Styles/Style.css";
import ButtonGlobal from "../Components/Button";
import InputField from "../Components/InputField";
import TextAreaField from "../Components/TextAreaField";
import DropdownField from "../Components/DropdownField";
import RadioButtonGroup from "../Components/RadioButtonGroup";
import CheckboxField from "../Components/CheckboxField";
import FileInputField from "../Components/FileInputField";

const BasicInputs = () => {
  const [formData, setFormData] = useState({
    textBox: "",
    textArea: "",
    dropdown: "",
    radio: "",
    checkbox: false,
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data Submitted: ", formData);
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h4
          className="py-3 fw-bold"
          style={{ color: "#7a70ba", borderBottom: "2px dotted #7a70ba" }}
        >
          Basic Form Inputs
        </h4>
      </div>
      <div className="card-body">
        <form
          onSubmit={handleSubmit}
          className="py-0"
          style={{ width: "1000px" }}
        >
          <div className="row pt-2">
            <div className="col-md-6 px-5">
              {/* Textbox */}
              <InputField
                label="Text Box"
                type="text"
                id="textBox"
                name="textBox"
                value={formData.textBox}
                onChange={handleChange}
                required={true}
              />

              {/* Text Area */}
              <TextAreaField
                label="Text Area"
                id="textArea"
                name="textArea"
                rows="4"
                value={formData.textArea}
                onChange={handleChange}
                required={true}
              />

              {/* Dropdown */}
              <DropdownField
                label="Dropdown"
                id="dropdown"
                name="dropdown"
                value={formData.dropdown}
                onChange={handleChange}
                options={["Option 1", "Option 2", "Option 3"]}
                required={true}
              />
            </div>

            <div className="col-md-6 px-5">
              {/* Radio Buttons */}
              <RadioButtonGroup
                label="Radio Buttons"
                name="radio"
                options={["Radio 1", "Radio 2"]}
                selectedValue={formData.radio}
                onChange={handleChange}
                className="py-3"
              />

              {/* Checkbox */}
              <CheckboxField
                label="Checkbox"
                id="checkbox"
                name="checkbox"
                checked={formData.checkbox}
                onChange={handleChange}
                className="py-3"
              />

              {/* File Upload */}
              <FileInputField
                label="Choose File"
                id="file"
                name="file"
                onChange={handleChange}
                className="py-3"
              />
            </div>
          </div>

          <div className="text-center py-3">
            <ButtonGlobal
              type="submit"
              text="Submit"
              className="btn text-white"
              style={{ backgroundColor: "#7a70ba" }}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default BasicInputs;