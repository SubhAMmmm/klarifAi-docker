
// src/LoginPage.js
import React from 'react';
import Login from './components/Login';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Image (shown on desktop/tablet) */}
      <div className="hidden md:flex md:w-1/2 relative">
        <img
          src="images/womanAI.jpg"
          alt="AI Technology Concept"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <img
                src="images/klarifi-logo-blue.png"
                alt="KLARIFai Logo"
                className="h-10"
              />
              <span className="ml-2 text-2xl font-bold text-gray-800">KLARIFai</span>
            </div>
            <h2 className="text-xl text-gray-600">GPT-Powered Insights Activator</h2>
          </div>

          {/* Login Component */}
          <Login />  {/* Render Login component here */}

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don’t have an account? <Link to="/signup" className="text-blue-500">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
