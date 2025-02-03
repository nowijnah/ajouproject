// import React, { useState } from 'react';
// import { 
//   Grid,
//   Box,
//   Container,
//   ThemeProvider,
//   useMediaQuery
// } from '@mui/material';
// import { theme } from '../common/styles';
// import FilterSection from './FilterSection';
// import PortfolioCard from './PortfolioCard';
// import SearchHeader from './SearchHeader';

// // 상수 정의
// const SORT_BUTTONS = [
//   { label: '최신순', value: '최신순' },
//   { label: '인기순', value: '인기순' },
//   { label: '업데이트순', value: '업데이트순' },
// ];

// const SAMPLE_PORTFOLIOS = [
//     {
//       id: 1,
//       title: "2024-1학기 소프트콘",
//       description: "강수빈",
//       image: "/logo.png",
//       semester: "2024-1"
//     },
//     {
//       id: 2,
//       title: "토스",
//       description: "2024-1 파란학기",
//       image: "/dnag.png",
//       semester: "2024-1"
//     },
//     {
//       id: 3,
//       title: "0000",
//       description: "□□□□□□□",
//       image: "/puppy.png",
//       semester: "2023-2"
//     },
//     {
//       id: 4,
//       title: "2023-2 캡스톤디자인",
//       description: "김민수",
//       image: "/placeholder.png",
//       semester: "2023-2"
//     },
//     {
//       id: 5,
//       title: "네이버 부스트캠프",
//       description: "이지원",
//       image: "/placeholder.png",
//       semester: "2023-1"
//     },
//     {
//       id: 6,
//       title: "카카오 인턴십",
//       description: "박준영",
//       image: "/placeholder.png",
//       semester: "2023-1"
//     },
//     {
//       id: 7,
//       title: "SW마에스트로",
//       description: "정다연",
//       image: "/placeholder.png",
//       semester: "2022-2"
//     },
//     {
//       id: 8,
//       title: "구글 인턴십",
//       description: "최유진",
//       image: "/placeholder.png",
//       semester: "2022-2"
//     },
//     {
//       id: 9,
//       title: "삼성 청년 SW 아카데미",
//       description: "한상우",
//       image: "/placeholder.png",
//       semester: "2022-1"
//     }
//   ];

// // 스타일 정의
// const styles = {
//   container: {
//     px: { xs: 2, sm: 4, md: 6 },
//     py: { xs: 2, md: 4 },
//     width: '100%',
//     padding: '32px 110px 48px 100px !important', // 마진 값 직접 지정
//   },
//   mainContent: {
//     display: 'flex',
//     flexDirection: { xs: 'column', lg: 'row' },
//     gap: { xs: 3, md: 10 }
//   },
//   filterSection: {
//     minWidth: '190px',
//     order: -1
//   }
// };

// export default function PortfolioList() {
//   // 상태 관리
//   const [activeSort, setActiveSort] = useState('최신순');
//   const [searchText, setSearchText] = useState('');
//   const [activeFilters, setActiveFilters] = useState({});
//   const isMobile = useMediaQuery('(max-width:900px)');

//   // 이벤트 핸들러
//   const handleSortChange = (sortType) => {
//     setActiveSort(sortType);
//   };

//   const handleSearch = () => {
//     console.log('Searching for:', searchText);
//   };

//   const handleFiltersChange = (filters) => {
//     setActiveFilters(filters);
//     console.log('Active filters:', filters);
//   };

//   const getFilteredPortfolios = () => {
//     return SAMPLE_PORTFOLIOS;
//   };

//   // 렌더링
//   const renderFilterSection = () => (
//     <FilterSection 
//       onFiltersChange={handleFiltersChange}
//       isMobile={isMobile}
//     />
//   );

//   const renderPortfolioGrid = () => (
//     <Box sx={{ flexGrow: 1 }}>
//       <Grid container spacing={{ xs: 2, md: 3 }}>
//         {getFilteredPortfolios().map((portfolio) => (
//           <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
//             <PortfolioCard {...portfolio} />
//           </Grid>
//         ))}
//       </Grid>
//     </Box>
//   );

//   return (
//     <ThemeProvider theme={theme}>
//       <Container maxWidth="xl" sx={styles.container}>
//         <Box sx={{ width: '100%' }}>
//           <SearchHeader 
//             searchText={searchText}
//             setSearchText={setSearchText}
//             handleSearch={handleSearch}
//             activeSort={activeSort}
//             handleSortChange={handleSortChange}
//             sortButtons={SORT_BUTTONS}
//           />

//           <Box sx={styles.mainContent}>
//             {isMobile && renderFilterSection()}
//             {renderPortfolioGrid()}
//             {!isMobile && (
//               <Box sx={styles.filterSection}>
//                 {renderFilterSection()}
//               </Box>
//             )}
//           </Box>
//         </Box>
//       </Container>
//     </ThemeProvider>
//   );
// }