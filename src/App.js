// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PortfolioList from './components/portfolio/PortfolioList';
import Home from './pages/Home';

export default function App() {
  return (
    <Router>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Navbar />
        <Box component="main" sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginTop: '64px' // Navbar 높이만큼 여백
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<PortfolioList />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </Router>
  );
}