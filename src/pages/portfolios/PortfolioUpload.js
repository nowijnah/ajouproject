import BasePostUpload from '../../components/post/BasePostUpload';

function PortfolioUpload() {
    
    // 나중에 필드 추가할 경우
    /* 
    const handleExtraFields = (data) => {
      // 프로젝트 기간, 사용 기술 등 추가
      return {
        ...data,
        projectPeriod: period,
        techStack: technologies,
      };
    };
    */
  
    return <BasePostUpload 
      collection="portfolios"
    //   onDataTransform={handleExtraFields}
    />;
}

export default PortfolioUpload;