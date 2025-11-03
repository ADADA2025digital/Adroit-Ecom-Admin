import React from "react";
import {messageData} from "../Constants/Data"; // adjust path as needed
import HeaderIcon from "./HeaderIcon";

export default function MessagePanel({ isOpen, onClose }) {
  return (
    <div className={`message-panel ${isOpen ? "open" : ""}`}>
      <div className="message-header">
        <h4 className="message-title">Messages</h4>
       <HeaderIcon className="text-dark"type="bi-x-lg" onClick={onClose} />
      </div>
      <ul className="message-list">
        {messageData.map((msg) => (
          <li key={msg.id}>
            <img src={msg.image} alt="profile" />
            <div>
              <strong>{msg.sender}</strong>
              <p>{msg.message}</p>
              <span>{msg.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
