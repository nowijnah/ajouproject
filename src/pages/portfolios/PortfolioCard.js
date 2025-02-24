// PortfolioCard.js
import React from 'react';
import ContentCard from '../../components/common/ContentCard';

const PortfolioCard = (props) => {
  return <ContentCard {...props} type="portfolio" />;
};

export default PortfolioCard;