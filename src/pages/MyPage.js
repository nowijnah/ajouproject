import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Button
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  ChatBubbleOutline as CommentIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MyPage = () => {
  const navigate = useNavigate();
  const fontStyle = {
    fontFamily: 'Quicksand, sans-serif'
  };

  const handleUploadClick = () => {
    navigate('/upload');
  };

  const portfolios = [
    {
      id: 1,
      title: "에코잉",
      description: "환경 문제에 대한 젊은층의 관심도 저하를 해결하고자 게임화 요소를 적용한 탄소 저감 앱",
      image: "/ecoing.png",
      likes: 1,
      comments: 0,
      tags: ["Flutter", "Firebase", "Dart", "JavaScript"]
    },
    {
      id: 2,
      title: "ML_TeamProject_24SS",
      description: "반려견의 백내장을 진단하는 AI 모델 개발 프로젝트에서, 초기 모델 리서치와 데이터 전처리 파트를 담당",
      image: "/dog.png",
      likes: 7,
      comments: 5,
      tags: ["ViT", "AI", "ML", "CNN"]
    },
  ];

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', pt: '64px' }}>
      {/* 상단 프로필 섹션 */}
      <Box sx={{ 
        width: '100%',
        backgroundColor: 'white',
        py: 11,
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <Box sx={{ 
          maxWidth: '1200px',
          margin: '0 auto',
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <Typography variant="h2" sx={{ 
            ...fontStyle, 
            fontWeight: 700,
            color: 'rgb(0, 51, 161)',
            mb: 1 
          }}>
            권세빈
          </Typography>
          <Typography variant="h5" sx={{ 
            ...fontStyle,
            fontWeight: 400,
            color: 'rgb(0, 51, 161)',
            mb: 2
          }}>
            아주대학교
          </Typography>
        </Box>
      </Box>

      {/* 하단 포트폴리오 섹션 */}
      <Box sx={{ 
        width: '100%',
        backgroundColor: 'rgb(0, 51, 161)',
        py: 6
      }}>
        <Box sx={{ 
          maxWidth: '1200px',
          margin: '0 auto',
          px: { xs: 2, sm: 3, md: 4 }
        }}>
          {/* 포트폴리오 헤더 */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h6" sx={{ ...fontStyle, color: 'white' }}>
              포트폴리오
            </Typography>
            <Button
              startIcon={<EditIcon />}
              onClick={handleUploadClick}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              variant="outlined"
            >
              Upload
            </Button>
          </Box>

          <Grid container spacing={3}>
            {portfolios.map((portfolio) => (
              <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
                <Card sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'white'
                }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={portfolio.image}
                    alt={portfolio.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ ...fontStyle, color: 'black' }}>
                      {portfolio.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ...fontStyle, mb: 2 }}>
                      {portfolio.description}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      flexWrap: 'wrap',
                      mb: 2
                    }}>
                      {portfolio.tags.map((tag, index) => (
                        <Typography
                          key={index}
                          variant="caption"
                          sx={{
                            backgroundColor: '#f5f5f5',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            color: 'text.secondary'
                          }}
                        >
                          {tag}
                        </Typography>
                      ))}
                    </Box>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size="small">
                          <FavoriteIcon fontSize="small" color="action" />
                        </IconButton>
                        <Typography variant="caption" color="text.secondary">
                          {portfolio.likes}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size="small">
                          <CommentIcon fontSize="small" color="action" />
                        </IconButton>
                        <Typography variant="caption" color="text.secondary">
                          {portfolio.comments}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default MyPage;