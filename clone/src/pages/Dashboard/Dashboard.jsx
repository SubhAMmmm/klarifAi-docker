/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Header from '../../components/dashboard/Header';
import Sidebar from '../../components/dashboard/Sidebar';
import MainContent from '../../components/dashboard/MainContent';
import Footer from '../../components/dashboard/Footer';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };


  return (
    <>
    <div className='p-0'>
    <div className="flex flex-col min-h-screen bg-[#303030] ">
      <Header />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onSelectChat={handleSelectChat} />
        <MainContent selectedChat={selectedChat}/>
      </div>
      <Footer />
    </div>
    </div>
    </>
  );
};

// Add prop types validation
Dashboard.propTypes = {
  isSidebarOpen: PropTypes.bool,
  selectedChat: PropTypes.object,
};

export default Dashboard
