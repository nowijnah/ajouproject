// PortfolioCard.js
import React from 'react';
import ContentCard from '../../components/card/ContentCard';

const PortfolioCard = (props) => {
  return <ContentCard {...props} type="portfolio" />;
};

export default PortfolioCard;