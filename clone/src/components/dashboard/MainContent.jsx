
// #######################################################

/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Paperclip, Send, User, Bot } from 'lucide-react';
import { documentService, chatService } from '../../utils/axiosConfig'; 
import { toast } from 'react-toastify';

const MainContent = ( selectedChat ) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState('');
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const chatEndRef = useRef(null);


  useEffect(() => {
    fetchUserDocuments();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      // Check if selectedChat and its properties are defined
      if (selectedChat.messages) {
        setConversation(selectedChat.messages);
      } else {
        setConversation([]); // Reset to empty if no messages
      }
      setSummary(selectedChat.summary || '');
      setFollowUpQuestions(selectedChat.follow_up_questions || []);
      setConversationId(selectedChat.conversation_id);
    }
  }, [selectedChat]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);


  // Fetch user documents
  const fetchUserDocuments = async () => {
    try {
      const response = await documentService.getUserDocuments();
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a document to upload.');
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('files', file);
  
      const response = await documentService.uploadDocument(formData);
      
      // Extensive logging
      console.log('Full Upload Response:', response);
      console.log('Response Data:', response.data);
      console.log('Documents:', response.data.documents);
      console.log('Message:', response.data.message);
  
      // Check if documents array exists and has items
      const documents = response.data.documents || [];
      
      if (documents.length > 0) {
        const document = documents[0];
        
        // Log full document details
        console.log('Full Document Details:', document);
        
        // Log specific fields
        console.log('Filename:', document.filename);
        console.log('Summary:', document.summary);
        console.log('Follow-up Questions:', document.follow_up_questions);
        console.log('Key Terms:', document.key_terms);
  
        // Attempt to set summary with fallback
        const summaryText = document.summary || 
                            document.text_summary || 
                            'No summary available';
        
        setSummary(summaryText);
        setFollowUpQuestions(document.follow_up_questions || []);
        
        // Additional check for summary
        if (summaryText === 'No summary generated' || summaryText === 'No summary available') {
          toast.warning('Document uploaded, but no summary was generated.');
        } else {
          toast.success('Document uploaded and processed successfully!');
        }
      } else {
        toast.warning('No documents were processed. Please try again.');
      }
    } catch (error) {
      // Detailed error logging
      console.error('Full Error Object:', error);
      console.error('Error Response:', error.response);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Error Status:', error.response.status);
        console.error('Error Data:', error.response.data);
        
        toast.error(`Upload failed: ${error.response.data.error || 'Unknown server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        console.error('Error Message:', error.message);
        toast.error(`Upload error: ${error.message}`);
      }
    }
  };
  
  // Handle document selection from dropdown
  const handleDocumentSelect = async (documentId) => {
    // Find the selected document
    const doc = documents.find(d => d.id === documentId);
    
    if (doc) {
      setSelectedDocument(doc);
      setSummary(doc.summary || 'No summary available');
      setFollowUpQuestions(doc.follow_up_questions || []);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please type a message.');
      return;
    }

    // Add user message to conversation
    const newConversation = [...conversation, { 
      role: 'user', 
      content: message 
    }];
    setConversation(newConversation);
    
    setIsLoading(true);
    try {
      // Prepare request data
      const requestData = {
        message: message,
        conversation_id: conversationId
      };

      // Send message
      const response = await chatService.sendMessage(requestData);

      // Add assistant's response to conversation
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        citations: response.data.citations || [],
        follow_up_questions: response.data.follow_up_questions || []
      };

      setConversation(prev => [...prev, assistantMessage]);
      
      // Update conversation ID
      setConversationId(response.data.conversation_id);

      // Clear input
      setMessage('');
    } catch (error) {
      console.error('Chat Error:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove the user message added earlier
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFollowUpQuestion = (question) => {
    setMessage(question);
    handleSendMessage();
  };

  return (
    <main className="flex-1 p-5">
      <div className="text-center max-w-4xl mx-auto mt-8">
        <div className="bg-black p-5 rounded-lg shadow-lg mx-auto max-w-2xl mb-8">
          <h1 className="text-white text-3xl font-bold">Welcome to Klarifai</h1>
        </div>
  
        <div className="mt-8 px-4">
          <input type="file" onChange={handleFileChange} />
          <button 
            onClick={handleUpload} 
            className="bg-gradient-to-r from-[#3344dc] to-[#5ff2b6] text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity ml-4"
          >
            Upload Document
          </button>
        </div>
        
        {/* Document Dropdown */}
        {documents.length > 0 && (
          <div className="flex-1">
            <select 
              onChange={(e) => handleDocumentSelect(Number(e.target.value))}
              className="w-full bg-[#414141] text-white p-2 rounded-lg"
            >
              <option value="">Select a Document</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename}
                </option>
              ))}
            </select>
          </div>
        )}
  
        {/* Chat Container */}
        <div className="mt-8 px-4 max-w-3xl mx-auto">
          <div className="bg-[#414141] rounded-lg p-4 h-[500px] overflow-y-auto">
            {conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-4 flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {msg.role === 'user' ? <User className="mr-2 h-5 w-5" /> : <Bot className="mr-2 h-5 w-5" />}
                    <span className="font-bold">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                  </div>
                  {msg.content}
                  
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 text-sm text-gray-300">
                      <strong>Citations:</strong>
                      {msg.citations.map((citation, cidx) => (
                        <div key={cidx} className="ml-2">
                          • {citation.source_file} (Page {citation.page_number})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-center text-white">
                Generating response...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
  
          {/* Message Input */}
          <div className="mt-4 relative">
            <div className="flex items-center bg-[#414141] rounded-lg p-2">
              <input
                type="text"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none focus:outline-none text-white px-4 disabled:opacity-50"
              />
              <button 
                onClick={handleSendMessage} 
                disabled={isLoading}
                className="bg-gradient-to-r from-[#3344dc] to-[#5ff2b6] text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {summary && <div className="mt-8 px-4 bg-[#414141] rounded-lg p-6">
            <h2 className="text-white text-2xl mb-4">Document Summary</h2>
            <p className="text-gray-300 mb-6">{summary}</p>
 
        </div>}
          
        {/* Follow-up Questions */}
        {followUpQuestions.length > 0 && (
          <div>
            <h3 className="text-white text-xl mb-3">Follow-up Questions:</h3>
            <ul className="list-disc pl-5">
              {followUpQuestions.map((question, index) => (
                <li 
                  key={index} 
                  className="text-gray-300 mb-2 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleFollowUpQuestion(question)}
                >
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
};

// Add prop types validation
MainContent.propTypes = {
  selectedChat: PropTypes.shape({
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        citations: PropTypes.array,
      })
    ),
    summary: PropTypes.string,
    follow_up_questions: PropTypes.arrayOf(PropTypes.string),
    conversation_id: PropTypes.string,
  }),
};

export default MainContent;