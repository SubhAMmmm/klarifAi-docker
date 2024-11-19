// /* eslint-disable no-unused-vars */
// import React, { useState } from 'react';

// const LoginForm = ({ onSuccess }) => {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: ''
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     // Add your login logic here
//     // For demo purposes:
//     const mockToken = 'mock-jwt-token';
//     onSuccess(mockToken);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium text-gray-600">Email</label>
//         <input
//           type="email"
//           required
//           value={formData.email}
//           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//           className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
//         />
//       </div>
      
//       <div>
//         <label className="block text-sm font-medium text-gray-600">Password</label>
//         <input
//           type="password"
//           required
//           value={formData.password}
//           onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//           className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
//         />
//       </div>

//       <button
//         type="submit"
//         className="w-full py-2 mt-6 font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-all duration-300"
//       >
//         Login
//       </button>
//     </form>
//   );
// };

// export default LoginForm;

/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import PropTypes from 'prop-types';

const LoginForm = ({ onSuccess = () => {} }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axiosInstance.post('http://localhost:8000/api/login/', {
                username,
                password,
            });
            const token = response.data.token; // Get token from response
            localStorage.setItem('token', token); // Store token in local storage
            onSuccess(token); // Call the onSuccess function passed as prop
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <input
                    type="text" 
                    placeholder="Username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-600">Password</label>
                <input
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <button
                type="submit"
                className="w-full py-2 mt-6 font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-all duration-300"
            >
                Login
            </button>
        </form>
    );
};

LoginForm.propTypes = {
  onSuccess: PropTypes.func
};

export default LoginForm;