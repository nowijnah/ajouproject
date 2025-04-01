// App.js
import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AuthProvider } from './components/auth/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import SettingsPage from './pages/SettingsPage';
import LoadingSpinner from './components/common/LoadingSpinner';

// 지연 로딩 적용
const Home = lazy(() => import('./pages/Home'));
const PortfolioPage = lazy(() => import('./pages/portfolios/PortfolioPage'));
const CompanyPage = lazy(() => import('./pages/companies/CompanyPage'));
const LabPage = lazy(() => import('./pages/labs/LabPage'));
const PortfolioView = lazy(() => import('./pages/portfolios/PortfolioView'));
const CompanyView = lazy(() => import('./pages/companies/CompanyView'));
const LabView = lazy(() => import('./pages/labs/LabView'));
const PortfolioUpload = lazy(() => import('./pages/portfolios/PortfolioUpload'));
const CompanyUpload = lazy(() => import('./pages/companies/CompanyUpload'));
const LabUpload = lazy(() => import('./pages/labs/LabUpload'));
const MyPage = lazy(() => import('./pages/MyPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SignIn = lazy(() => import('./components/auth/SignIn').then(module => ({ default: module.SignIn })));
const SignUp = lazy(() => import('./components/auth/SignUp').then(module => ({ default: module.SignUp })));
const SoftconProjectsPage = lazy(() => import('./pages/SoftconProjectPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const AdminNotices = lazy(() => import('./pages/admin/AdminNotices'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSoftcon = lazy(() => import('./pages/admin/AdminSoftcon'));
const NoticeView = lazy(() => import('./pages/notices/NoticeView'));
const NoticeList = lazy(() => import('./pages/notices/NoticeList'));

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
            <Suspense fallback={<LoadingSpinner message="페이지 로딩 중..." />}>
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

                {/* Public Routes */}
                <Route path="/portfolios" element={<PortfolioPage />} />
                <Route path="/portfolios/:postId" element={<PortfolioView />} />
                <Route path="/labs" element={<LabPage />} /> 
                <Route path="/labs/:postId" element={<LabView />} />
                <Route path="/companies" element={<CompanyPage />} />
                <Route path="/companies/:postId" element={<CompanyView />} />
                <Route path="/softcon" element={<SoftconProjectsPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/notices" element={
                  <ProtectedRoute>
                    <AdminNotices />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute>
                    <AdminUsers />
                  </ProtectedRoute>
                } />
                <Route path="/admin/softcon" element={
                  <ProtectedRoute>
                    <AdminSoftcon />
                  </ProtectedRoute>
                } />

                {/* Notice Routes */}
                <Route path="/notices" element={<NoticeList />} />
                <Route path="/notices/:noticeId" element={<NoticeView />} />
              </Routes>
            </Suspense>
          </Box>
          <Footer />
        </Box>
      </Router>
    </AuthProvider>
  );
}