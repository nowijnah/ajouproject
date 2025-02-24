// CompanyCard.js
import React from 'react';
import ContentCard from '../../components/common/ContentCard';

const CompanyCard = (props) => {
  return <ContentCard {...props} type="company" />;
};

export default CompanyCard;