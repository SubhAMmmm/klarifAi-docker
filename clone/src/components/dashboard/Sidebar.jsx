/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Settings, CircleHelp, Plus, ChevronDown } from 'lucide-react';
import { documentService } from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const Sidebar = ({ isOpen, onSelectChat }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatHistoryVisible, setIsChatHistoryVisible] = useState(false);

  useEffect(() => {
    
    const fetchChatHistory = async () => {
      try {
        const response = await documentService.getChatHistory();
        
        const parsedChatHistory = response.data.map(chat => {
          let messageData;
    
          // Check if chat.question is defined and parse it
          if (chat.question) {
            try {
              messageData = JSON.parse(chat.question.replace(/'/g, '"'));
              messageData.role = "user"; // Set role if this is a user message
            } catch (parseError) {
              console.error('Failed to parse question:', parseError);
              messageData = null; // Set to null if parsing fails
            }
          } 
          
          // If question is not defined, check the preview field
          if (!messageData && chat.preview) {
            try {
              messageData = JSON.parse(chat.preview.replace(/'/g, '"'));
              messageData.role = "user"; // Set role if this is a user message
            } catch (parseError) {
              console.error('Failed to parse preview:', parseError);
              messageData = null; // Set to null if parsing fails
            }
          }
    
          // Return the chat object with messages
          return {
            ...chat,
            messages: messageData ? [messageData] : [] // Store the parsed message or an empty array
          };
        });
    
        setChatHistory(parsedChatHistory);
      } catch (error) {
        console.error('Failed to fetch chat history', error);
        toast.error('Failed to load chat history');
      }
    };

    fetchChatHistory();
  }, []);

  const toggleChatHistory = () => {
    setIsChatHistoryVisible(!isChatHistoryVisible);
  };

  return (
    <aside className={`${isOpen ? 'w-1/4' : 'w-0'} bg-[#46464673] text-white transition-all duration-300 overflow-y-auto rounded-tr-lg rounded-br-lg min-h-[85vh] relative`}>
      <div className="p-4">
        <div className="mb-4">
          <div className="my-4">
            <span className="text-[#d6292c] font-semibold text-lg bg-white p-2 rounded px-9 flex items-center gap-2">
              <Plus size={20} /> 
              New Chat
            </span>
          </div>
          
          <div className="mt-4">
            <h6 className="text-white mb-2 flex justify-between items-center">
              Recent Chats
              <button onClick={toggleChatHistory} className="text-white">
                {isChatHistoryVisible ? 'Hide' : 'Show'}
              </button>
            </h6>
            {isChatHistoryVisible && (
              <div className="space-y-2">
                {chatHistory.map((chat, index) => (
                  <div key={index} className="flex justify-between items-center group cursor-pointer" onClick={() => onSelectChat(chat)}>
                    <span>
                      {Array.isArray(chat.messages) && chat.messages.length > 0 
                        ? chat.messages[0].message // Access the 'message' property
                        : 'No messages'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-600 pt-4">
          <div className="space-y-3">
            <button className="text-white w-full text-left flex items-center gap-2">
              <Settings size={20} />
              Settings
            </button>
            <button className="text-white w-full text-left flex items-center gap-2">
              <CircleHelp size={20} />
              Help
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

// Add prop types validation
Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onSelectChat: PropTypes.func.isRequired,
};

export default Sidebar;