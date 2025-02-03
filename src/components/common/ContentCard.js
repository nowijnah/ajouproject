import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { contentCardStyles } from './styles';

export default function ContentCard({ title, description, image, additionalInfo }) {
  return (
    <Card sx={contentCardStyles.card}>
      <Box sx={contentCardStyles.mediaBox}>
        <CardMedia
          component="img"
          image={image}
          alt={title}
          sx={contentCardStyles.media}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography 
          gutterBottom 
          variant="h6" 
          component="div"
          sx={contentCardStyles.title}
        >          
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={contentCardStyles.description}
        >
          {description}
        </Typography>
        {additionalInfo && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={contentCardStyles.additionalInfo}
          >
            {additionalInfo}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
} 