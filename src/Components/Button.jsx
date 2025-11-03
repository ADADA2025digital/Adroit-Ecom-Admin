import React from "react";

const ButtonGlobal = ({ type, text, onClick, className, style, id,children,disabled  }) => {
  return (
    <button
      type={type}
      id={id}              
      className={className}
      onClick={onClick}
      style={style}
       disabled={disabled}
    >
      {children || text}
    </button>
  );
};

export default ButtonGlobal;
