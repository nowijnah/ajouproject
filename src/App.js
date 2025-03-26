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
import ProfilePage from './pages/ProfilePage';
import {SignIn} from './components/auth/SignIn';
import {SignUp} from './components/auth/SignUp';
import { AuthProvider } from './components/auth/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import SettingsPage from './pages/SettingsPage';

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
              <Route path="/signup" element={<SignUp />} /> 
              <Route path="/signin" element={<SignIn />} />

              {/* Protected Routes */}
              <Route path="/mypage" element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              {/* Protected Upload Routes */}
              <Route path="/portfolios/new" element={
                <ProtectedRoute>
                  <PortfolioUpload />
                </ProtectedRoute>
              } />
              <Route path="/portfolios/:postId/edit" element={
                <ProtectedRoute>
                  <PortfolioUpload />
                </ProtectedRoute>
              } />
              
              <Route path="/labs/new" element={
                <ProtectedRoute>
                  <LabUpload />
                </ProtectedRoute>
              } />
              <Route path="/labs/:postId/edit" element={
                <ProtectedRoute>
                  <LabUpload />
                </ProtectedRoute>
              } />
              
              <Route path="/companies/new" element={
                <ProtectedRoute>
                  <CompanyUpload />
                </ProtectedRoute>
              } />
              <Route path="/companies/:postId/edit" element={
                <ProtectedRoute>
                  <CompanyUpload />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />

              {/* Public Routes */}
              <Route path="/portfolios" element={<PortfolioPage />} />
              <Route path="/portfolios/:postId" element={<PortfolioView />} />
              <Route path="/labs" element={<LabPage />} /> 
              <Route path="/labs/:postId" element={<LabView />} />
              <Route path="/companies" element={<CompanyPage />} />
              <Route path="/companies/:postId" element={<CompanyView />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </Router>
    </AuthProvider>
  );
}