import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css'; 
import UrlShortener from './pages/UrlShortener';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/shortener" element={<UrlShortener />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
