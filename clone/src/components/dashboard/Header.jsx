/* eslint-disable no-unused-vars */
import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/Logo1.png';


const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  return (
    <>
    <header className="border-b border-gray-700">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center space-x-4">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-12 w-auto"
          />
          <h5 className="hidden lg:block text-white text-lg">
            GPT-Powered Insights Activator
          </h5>
        </div>
        
        <div className="flex items-center space-x-4 px-3">
          <img 
            src="/api/placeholder/40/40" 
            alt="Profile" 
            className="h-10 w-10 rounded-full border border-black"
          />
          <span className="text-white">John Doe</span>
          <LogOut 
            className="h-5 w-5 text-white cursor-pointer" 
            onClick={handleLogout}
          />
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;