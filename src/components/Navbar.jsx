import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusOutlined, HomeOutlined, FileTextOutlined } from '@ant-design/icons';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <FileTextOutlined className="navbar-brand-icon" />
          <span>PDF Builder</span>
        </Link>
        
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`navbar-link ${isActive('/') && !isActive('/builder') && !isActive('/view') ? 'active' : ''}`}
          >
            <HomeOutlined />
            <span>Templates</span>
          </Link>
          <Link 
            to="/builder" 
            className={`navbar-link navbar-link-primary ${isActive('/builder') ? 'active' : ''}`}
          >
            <PlusOutlined />
            <span>New Template</span>
          </Link>
        </div>
      </div>
      <div className="navbar-accent"></div>
    </nav>
  );
};

export default Navbar;
