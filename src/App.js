import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PortfolioPage from './pages/PortfolioPage';
import CompanyPage from './pages/CompanyPage';
import LabPage from './pages/LabPage';
import MyPage from './pages/MyPage';
import UploadPost from './components/posts/UploadPost';
import {SignIn} from './components/auth/SignIn';
import {SignUp} from './components/auth/SignUp';
import { AuthProvider } from './components/auth/AuthContext';

export default function App() {
  return (
    <AuthProvider>
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
          marginTop: '64px',
          marginBottom: '64px'
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/lab" element={<LabPage />} /> 
            <Route path='/mypage' element={<MyPage />} />
            <Route path="/upload" element={<UploadPost />} />   
            <Route path="/signup" element={<SignUp />} /> 
            <Route path="/signin" element={<SignIn />} />       
          </Routes>
        </Box>
        <Footer />
      </Box>
    </Router>
    </AuthProvider>
  );
}