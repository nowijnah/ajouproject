import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';

export default function PortfolioCard({ title, description, image }) {
  return (
    <Card sx={{ 
      border: '1px solid #e0e0e0',
      boxShadow: 'none',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ 
        height: { xs: 150, sm: 200 },
        position: 'relative',
        margin: '16px 16px 0 16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <CardMedia
          component="img"
          image={image}
          alt={title}
          sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography 
            gutterBottom 
            variant="h6" 
            component="div"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >          
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}