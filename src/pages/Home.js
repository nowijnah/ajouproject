// src/pages/Home.js
import { Typography } from '@mui/material';
import React from 'react';

function Home() {
  return (
    <div style={{ 
      display: 'flex',
      minHeight: 'calc(100vh - 80px)', // Navbar 높이 고려
    }}>
      {/* 왼쪽 파란색 섹션 */}
      <box style={{ 
        flex: '0 0 30%', // 왼쪽 섹션 너비 40%로 고정
        backgroundColor: 'rgb(0, 51, 161)', 
        color: 'white',
        padding: '2rem'
      }}>
        <Typography variant="h2" component="h1" sx={{ 
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '1rem'
        }}>
            Innovation<br/>Starts<br/>Here<br/>
        </Typography>
        <Typography variant='body2'>
            아주대학교 산학협력 플랫폼에 오신 것을 환영합니다<br/><br/>
            아주대학교의 뛰어난 연구진과 기업의 혁신적인 아이디어, 그리고 학생들의 신선한 도전이 만나는 곳입니다. 연구실의 첨단 기술, 기업의 실용적 니즈, 학생들의 성장 포트폴리오가 어우러져 함께 발전하는 플랫폼을 제공합니다.
        </Typography>
      </box>
      
      {/* 오른쪽 컨텐츠 섹션 */}
      <div style={{ 
        flex: '0 0 70%', // 오른쪽 섹션 너비 60%로 고정
        padding: '5rem'
      }}>
        <Typography variant='h4'>원하시는 서비스를 선택해주세요  </Typography>
        <Typography variant='h9'> <br/>연구 프로젝트 참여, 기술 협력, 산학 연계 등 다양한 서비스를 이용하실 수 있습니다.  각각의 서비스는 로그인 후 이용 가능합니다.</Typography>
        
      </div>
    </div>
  );
}

export default Home;