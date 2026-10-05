// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: '#f9fafb',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '480px',
      }}>
        <h1 style={{
          fontSize: '72px',
          fontWeight: 700,
          margin: 0,
          color: '#111827',
          lineHeight: 1,
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          margin: '16px 0 8px',
          color: '#111827',
        }}>
          Page Not Found
        </h2>
        <p style={{
          fontSize: '15px',
          color: '#6b7280',
          marginBottom: '32px',
        }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#111827',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Go back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;