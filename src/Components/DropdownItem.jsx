import React from "react";
import "../Assets/Styles/Style.css";

const DropdownItem = ({ image, sender, message, time, onRemove }) => {

  const handleRemoveClick = (e) => {
    e.stopPropagation(); 
    onRemove(); 
  };

  return (
    <div className="message position-relative d-flex justify-content-center align-items-center  pt-2 px-2">
      <img
        src={image}
        alt="User Profile"
        className="rounded-circle"
        style={{ width: "30px", height: "30px" }}
      />
      <div className="message-content d-flex flex-column px-2">
        <p className="m-0 text-start">
          <strong>{sender}</strong>
        </p>
        <p className="m-0 text-start">{message}</p>
      </div>
      <span className="message-time text-nowrap">{time}</span>
      <i
        className="bi bi-x close-icon text-secondary position-absolute cursor-pointer"
        style={{ cursor: "pointer" }}
        onClick={handleRemoveClick}
      ></i>
    </div>
  );
};

export default DropdownItem;
