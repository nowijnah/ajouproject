import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Link as RouterLink } from 'react-router-dom';
import React from 'react';
import NoticeSection from '../components/home/NoticeSection';
import { useNavigate } from 'react-router-dom';

function Home() {
  const fontStyle = {
    fontFamily: 'Quicksand, sans-serif'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: { xs: '0 16px', sm: '0 24px', md: '0 32px' },
    width: '100%',
    boxSizing: 'border-box',
  };

  const sectionStyle = {
    display: 'flex',
    backgroundColor: '#fff',
    borderRadius: 2,
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    flexDirection: { xs: 'column', sm: 'column', md: 'row' },
    gap: { xs: 0, sm: 0, md: 3 },
    width: '100%',
    boxSizing: 'border-box',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }
  };

  const imageBoxStyle = {
    width: { xs: '100%', sm: '100%', md: '280px' },
    height: { xs: '200px', sm: '240px', md: '200px' },
    flexShrink: 0,
    '& img': { 
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  };

  const contentBoxStyle = {
    flex: 1,
    p: { xs: 2, sm: 3, md: 3 },
    minWidth: 0  // 이것이 flex item의 overflow를 방지합니다
  };

  const navigate = useNavigate();

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'column', md: 'row' },
        width: '100%'
      }}>
        {/* 왼쪽 파란색 섹션 */}
        <Box sx={{ 
          width: { xs: '100%', sm: '100%', md: '30%' },
          backgroundColor: 'rgb(0, 51, 161)', 
          color: 'white',
          padding: { xs: '2rem 1rem', sm: '2rem', md: '2rem' }
        }}>
          <Box sx={containerStyle}>
            <Typography variant="h2" component="h1" sx={{ 
                ...fontStyle,
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: '1rem',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }}>
                Innovation<br/>Starts<br/>Here<br/>
            </Typography>
            <Typography variant='body2' sx={fontStyle}>
                아주대학교 산학협력 플랫폼에 오신 것을 환영합니다<br/><br/>
                아주대학교의 뛰어난 연구진과 기업의 혁신적인 아이디어, 그리고 학생들의 신선한 도전이 만나는 곳입니다.
            </Typography>
          </Box>
        </Box>
        
        {/* 오른쪽 컨텐츠 섹션 */}
        <Box sx={{ 
          width: { xs: '100%', sm: '100%', md: '70%' },
          padding: { xs: '1rem', sm: '1.5rem', md: '2rem' }
        }}>
          <Box sx={containerStyle}>
            <Typography variant='h4' sx={{ 
              mb: 3, 
              fontWeight: 600,
              ...fontStyle,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
            }}>
              원하시는 서비스를 선택해주세요
            </Typography>
            <Typography variant='body1' sx={{ 
              mb: 4,
              ...fontStyle
            }}>
              연구 프로젝트 참여, 기술 협력, 산학 연계 등 다양한 서비스를 이용하실 수 있습니다.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3, md: 4 } }}>
              {/* 학생 포트폴리오 섹션 */}
              <RouterLink to="/portfolios" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box sx={sectionStyle}>
                  <Box sx={imageBoxStyle}>
                    <img src="/student.png" alt="학생 포트폴리오" />
                  </Box>
                  <Box sx={contentBoxStyle}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      ...fontStyle,
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.5rem' }
                    }}>
                      학생 포트폴리오 보기 
                    </Typography>
                    <Typography variant="body2" sx={fontStyle}>
                      <br />아주대학교 학생들의 다양한 프로젝트 경험과 연구 성과를 한눈에 확인할 수 있습니다. 
                      <br />각 학생의 포트폴리오를 통해 전공 분야, 기술 스택, 프로젝트 이력을 살펴보고 관심 있는 인재에게 직접 프로젝트 참여나 채용을 제안해보세요.
                    </Typography>
                  </Box>
                </Box>
              </RouterLink>

              {/* 연구실 목록 섹션 */}
              <RouterLink to="/labs" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box sx={sectionStyle}>
                  <Box sx={imageBoxStyle}>
                    <img src="/lab.png" alt="연구실 목록" />
                  </Box>
                  <Box sx={contentBoxStyle}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      ...fontStyle,
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.5rem' }
                    }}>
                      연구실 목록 보기
                    </Typography>
                    <Typography variant="body2" sx={fontStyle}>
                      <br />아주대학교의 다양한 연구실 정보와 진행 중인 연구 프로젝트를 확인할 수 있습니다. 각 연구실의 주요 연구 분야, 실적, 참여 가능한 프로젝트를 살펴보고 관심 있는 분야에 직접 문의해보세요.
                    </Typography>
                  </Box>
                </Box>
              </RouterLink>

              {/* 기업 뉴스 섹션 */}
              <RouterLink to="/companies" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box sx={sectionStyle}>
                  <Box sx={imageBoxStyle}>
                    <img src="/company.png" alt="기업 뉴스" />
                  </Box>
                  <Box sx={contentBoxStyle}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      ...fontStyle,
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.5rem' }
                    }}>
                      기업 뉴스 보기
                    </Typography>
                    <Typography variant="body2" sx={fontStyle}>
                      <br />산학협력에 참여하는 다양한 기업들의 정보와 진행 중인 프로젝트를 확인할 수 있습니다. 기업별 진행 프로젝트, 기술 협력 요청, 채용 정보를 살펴보고 관심 있는 기업에 직접 지원해보세요.
                    </Typography>
                  </Box>
                </Box>
              </RouterLink>
            
            {/* 구분선 */}
            <Box sx={{ 
              my: { xs: 4, sm: 5, md: 6 },
              borderBottom: '1px solid #e0e0e0'
            }} />

            {/* 공지사항 섹션 */}
            <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Typography variant='h4' sx={{ 
                  fontWeight: 600,
                  ...fontStyle,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
                }}>
                  공지사항
                </Typography>
                <Box 
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    color: '#2196f3',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(33, 150, 243, 0.2)',
                    },
                    ...fontStyle
                  }}
                  onClick={() => navigate('/notices')}
                >
                  모든 공지 보기
                </Box>
              </Box>

              <NoticeSection />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
  );
}

export default Home;