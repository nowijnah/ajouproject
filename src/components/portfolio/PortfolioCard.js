import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';

export default function PortfolioCard({ title, description, image }) {
  return (
    <Card sx={{ 
      border: '1px solid #e0e0e0',
      boxShadow: 'none'
    }}>
      <Box sx={{ 
        height: 200,
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
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}