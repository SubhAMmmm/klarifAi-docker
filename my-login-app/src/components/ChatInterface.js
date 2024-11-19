// // src/components/ChatInterface.js
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaMicrophone, FaPaperclip, FaMoon, FaSun, FaUserCircle } from 'react-icons/fa';

// const ChatInterface = () => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [isRecording, setIsRecording] = useState(false);
//   const [theme, setTheme] = useState('light');
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const navigate = useNavigate();

//   // Handle Logout
//   const handleLogout = () => {
//     localStorage.removeItem('isLoggedIn');
//     navigate('/');
//   };

//   // Handle Theme Toggle
//   const toggleTheme = () => {
//     setTheme(theme === 'light' ? 'dark' : 'light');
//     document.body.classList.toggle('dark-theme');
//   };

//   // Handle Mic Function
//   const handleMicClick = () => {
//     setIsRecording(!isRecording);
//     if (isRecording) {
//       console.log('Stopped recording');
//     } else {
//       console.log('Recording...');
//     }
//   };

//   // Handle File Upload
//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       console.log('File uploaded:', file.name);
//       // Implement file upload handling logic here
//     }
//   };

//   // Handle Send Message
//   const handleSendMessage = () => {
//     if (input.trim() !== '') {
//       setMessages([...messages, { type: 'user', text: input }]);
//       setInput('');
//       // Mock response - you can replace this with actual API call logic
//       setMessages((prev) => [...prev, { type: 'bot', text: 'This is a response from the bot.' }]);
//     }
//   };

//   // Handle Enter and Shift+Enter in Textarea
//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen">
//       {/* Top Bar */}
//       <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
//         <div className="text-2xl font-bold">LOGO</div>
//         <div className="flex items-center space-x-4">
//           {/* Theme Toggle */}
//           <button onClick={toggleTheme} title="Toggle Theme">
//             {theme === 'light' ? <FaMoon /> : <FaSun />}
//           </button>

//           {/* User Profile */}
//           <div
//             className="relative"
//             onMouseEnter={() => setShowProfileMenu(true)}
//             onMouseLeave={() => setShowProfileMenu(false)}
//           >
//             <FaUserCircle
//               size={24}
//               className="cursor-pointer"
//               title="User Profile"
//               onClick={() => setShowProfileMenu(!showProfileMenu)}
//             />
//             {showProfileMenu && (
//               <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md overflow-hidden z-10 text-black">
//                 <p className="p-2">User Name</p>
//                 <button
//                   className="w-full text-left p-2 hover:bg-gray-200"
//                   onClick={handleLogout}
//                 >
//                   Logout
//                 </button>
//                 {/* Additional features can be added here */}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="flex flex-1">
//         {/* Sidebar */}
//         <div className="w-1/4 bg-gray-800 text-white p-4 overflow-y-auto">
//           <h2 className="text-lg font-bold mb-4">Conversation History</h2>
//           <ul>
//             <li className="mb-2 cursor-pointer">Conversation 1</li>
//             <li className="mb-2 cursor-pointer">Conversation 2</li>
//             <li className="mb-2 cursor-pointer">Conversation 3</li>
//           </ul>
//         </div>

//         {/* Main Chat Area */}
//         <div className="flex flex-col w-3/4 bg-gray-100">
//           <div className="flex-1 p-4 overflow-y-auto">
//             <h1 className="text-xl font-semibold mb-4">Welcome to the Chat Interface!</h1>
//             {messages.map((message, index) => (
//               <div
//                 key={index}
//                 className={`my-2 p-2 rounded-md ${
//                   message.type === 'user' ? 'bg-blue-200 self-end' : 'bg-gray-300 self-start'
//                 }`}
//               >
//                 {message.text}
//               </div>
//             ))}
//           </div>

//           {/* Bottom Input Section */}
//           <div className="flex items-center p-4 bg-white border-t border-gray-300">
//             <label htmlFor="file-upload" className="cursor-pointer mr-2" title="Upload File">
//               <FaPaperclip />
//             </label>
//             <input
//               type="file"
//               id="file-upload"
//               className="hidden"
//               onChange={handleFileUpload}
//             />

//             <button onClick={handleMicClick} className="text-gray-500 mr-2" title="Voice Input">
//               <FaMicrophone color={isRecording ? 'red' : 'gray'} />
//             </button>

//             <textarea
//               className="flex-1 px-4 py-2 border rounded-md border-gray-300 focus:outline-none resize-none"
//               placeholder="Type your question..."
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={handleKeyDown}
//               rows={1}
//             />

//             <button
//               onClick={handleSendMessage}
//               className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2"
//             >
//               Send
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatInterface;

// src/components/ChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMicrophone, FaPaperclip, FaMoon, FaSun, FaUserCircle } from 'react-icons/fa';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUsernameHover, setShowUsernameHover] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load username from localStorage when the component mounts
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Initialize SpeechRecognition API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript); // Display both interim and final transcripts
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition API is not supported in this browser.');
    }
  }, []);

  // Toggle Speech Recognition on Mic Button Click
  const handleMicClick = () => {
    if (recognitionRef.current) {
      if (isRecording) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
      setIsRecording(!isRecording);
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    navigate('/');
  };

  // Handle Theme Toggle
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme');
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File uploaded:', file.name);
    }
  };

  // Handle Send Message
  const handleSendMessage = () => {
    if (input.trim() !== '') {
      setMessages([...messages, { type: 'user', text: input }]);
      setInput('');
      setMessages((prev) => [...prev, { type: 'bot', text: 'This is a response from the bot.' }]);
    }
  };

  // Handle Enter and Shift+Enter in Textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
        <div className="text-2xl font-bold">LOGO</div>
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button onClick={toggleTheme}>
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>

          {/* User Profile */}
          <div
            className="relative"
            onMouseEnter={() => setShowUsernameHover(true)}
            onMouseLeave={() => setShowUsernameHover(false)}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            ref={profileMenuRef}
          >
            <FaUserCircle size={24} className="cursor-pointer" />
            {showUsernameHover && !showProfileMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white text-black p-2 rounded-md shadow-lg">
                {username || 'User Name'}
              </div>
            )}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md overflow-hidden z-10 text-black"
              >
                <button className="w-full text-left p-2 hover:bg-gray-200">Profile</button>
                <button
                  className="w-full text-left p-2 hover:bg-gray-200"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-1/4 bg-gray-800 text-white p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Conversation History</h2>
          <ul>
            <li className="mb-2 cursor-pointer">Conversation 1</li>
            <li className="mb-2 cursor-pointer">Conversation 2</li>
            <li className="mb-2 cursor-pointer">Conversation 3</li>
          </ul>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col w-3/4 bg-gray-100">
          <div className="flex-1 p-4 overflow-y-auto">
            <h1 className="text-xl font-semibold mb-4">Welcome to the Chat Interface!</h1>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`my-2 p-2 rounded-md ${
                  message.type === 'user' ? 'bg-blue-200 self-end' : 'bg-gray-300 self-start'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          {/* Bottom Input Section */}
          <div className="flex items-center p-4 bg-white border-t border-gray-300">
            <label htmlFor="file-upload" className="cursor-pointer mr-2">
              <FaPaperclip />
            </label>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button onClick={handleMicClick} className="text-gray-500 mr-2">
              <FaMicrophone color={isRecording ? 'red' : 'gray'} />
            </button>

            {/* Textarea with dark mode compatibility */}
            <textarea
              className="flex-1 px-4 py-2 border rounded-md input-field resize-none"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />

            <button
              onClick={handleSendMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
