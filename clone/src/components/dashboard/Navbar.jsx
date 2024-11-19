/* eslint-disable no-unused-vars */
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav>
            <h1>Document Chat</h1>
            <Link to="/">Home</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/history">Chat History</Link>
        </nav>
    );
};

export default Navbar;