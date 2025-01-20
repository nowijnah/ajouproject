import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PortfolioList from './components/portfolio/PortfolioList';

function Home() {
  return (
    <div style={{ paddingTop: '80px' }}>
      <h1>홈 화면</h1>
      {/* 컨텐츠 추가 */}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<PortfolioList />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}