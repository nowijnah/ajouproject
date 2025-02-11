// App.js
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PortfolioPage from './pages/portfolios/PortfolioPage';
import CompanyPage from './pages/companies/CompanyPage';
import LabPage from './pages/labs/LabPage';
import PortfolioView from './pages/portfolios/PortfolioView';
import CompanyView from './pages/companies/CompanyView';
import LabView from './pages/labs/LabView';
import PortfolioUpload from './pages/portfolios/PortfolioUpload';
import CompanyUpload from './pages/companies/CompanyUpload';
import LabUpload from './pages/labs/LabUpload';
import MyPage from './pages/MyPage';
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
            <Route path='/mypage' element={<MyPage />} />
            <Route path="/signup" element={<SignUp />} /> 
            <Route path="/signin" element={<SignIn />} />        

            {/* 포트폴리오 */}
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/portfolio/:postId" element={<PortfolioView />} />
            <Route path="/portfolio/:postId/edit" element={<PortfolioUpload />} />
            <Route path="/portfolio/new" element={<PortfolioUpload />} />

            {/* 연구실 */}
            <Route path="/lab" element={<LabPage />} /> 
            <Route path="/lab/:postId" element={<LabView />} />
            <Route path="/lab/:postId/edit" element={<LabUpload />} />
            <Route path="/lab/new" element={<LabUpload />} />

            {/* 회사 */}
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/company/:postId" element={<CompanyView />} />
            <Route path="/company/:postId/edit" element={<CompanyUpload />} />
            <Route path="/company/new" element={<CompanyUpload />} />    
          </Routes>
        </Box>
        <Footer />
      </Box>
    </Router>
    </AuthProvider>
  );
}