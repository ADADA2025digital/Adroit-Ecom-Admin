import React, { useState } from "react";
import "../Assets/Styles/Style.css";
import DropdownItem from "./DropdownItem";
import Profile from "../Assets/Images/profile.png";

const Dropdown = ({ title, style }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      image: Profile,
      sender: "Hackett Yessenia",
      message: "Hello Miss... 😊 Just got an order",
      time: "2 hours",
    },
    {
      id: 2,
      image: Profile,
      sender: "Schneider Adan",
      message: "Wishing You a Happy Birthday Dear.. 🎉💐",
      time: "3 hours",
    },
    {
      id: 3,
      image: Profile,
      sender: "Mahdi Gholizadeh",
      message: "Hello Dear!! This Theme Is Very beautiful",
      time: "5 hours",
    },
    
  ]);

  const removeMessage = (id) => {
    setMessages(messages.filter((msg) => msg.id !== id));
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  return (
    <div
      className="dropdown d-block position-absolute end-0 shadow bg-white"
      style={{
        ...style,
        zIndex: 1050,
        maxWidth: isMobile ? "320px" : "250px",
      }}
    >
      <div className="dropdown-header text-center fw-bold fs-6 py-2">
        {title}
      </div>

      {messages.length > 0 ? (
        messages.map((msg) => (
          <DropdownItem
            key={msg.id}
            image={msg.image}
            sender={msg.sender}
            message={msg.message}
            time={msg.time}
            onRemove={() => removeMessage(msg.id)}
          />
        ))
      ) : (
        <div className="text-center py-3 text-muted">No new messages</div>
      )}
    </div>
  );
};

export default Dropdown;
