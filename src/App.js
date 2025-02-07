// App.js
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
//import PortfolioList from './components/portfolio/PortfolioList';
import Home from './pages/Home';
import PortfolioPage from './pages/PortfolioPage';
import CompanyPage from './pages/CompanyPage';
import LabPage from './pages/LabPage';
import MyPage from './pages/MyPage';
import UploadPost from './components/posts/UploadPost';

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
          marginTop: '64px'
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/lab" element={<LabPage />} /> 
            <Route path='/mypage' element={<MyPage />} />
            <Route path="/upload" element={<UploadPost />} />         
          </Routes>
        </Box>
        <Footer />
      </Box>
    </Router>
  );
}