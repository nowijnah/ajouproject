import React from 'react';
import { useParams } from 'react-router-dom';
import BasePostView from '../../components/posts/view/BasePostView';

function PortfolioView() {
    const { postId } = useParams();

    // Softcon 프로젝트인지 확인하기 위한 조건.. id가 4자리인거 (아직까지는)
    const isSoftconProject = postId.length<5;
    console.log(isSoftconProject ? "softcon_projects" : "portfolios");

    return (
        <BasePostView collectionName={isSoftconProject ? "softcon_projects" : "portfolios"} />
    );
}

export default PortfolioView;
