// LabCard.js
import React from 'react';
import ContentCard from '../../components/card/ContentCard';

const LabCard = (props) => {
  return <ContentCard {...props} type="lab" />;
};

export default LabCard;