// src/components/common/Input.jsx
import React from 'react';

const Input = ({
  label,
  type = 'text',
  id,
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  ...props
}) => {
  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="input-wrapper">
        {Icon && <Icon className="input-icon" size={18} />}
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;  // <--- THIS LINE IS CRITICAL!