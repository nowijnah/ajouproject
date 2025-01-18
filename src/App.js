import React from 'react';
import music_list from './data';
import Favorites from './Favorites';
import SearchPage from './SearchPage';
import {Box, Tabs, Tab, Typography, AppBar, CssBaseline} from '@mui/material';

export default function App () {
    const [currentTab, setCurrentTab] = React.useState(0);
    const [searchResult, setSearchResult] = React.useState([]);
    const [favorites, setFavorites] = React.useState([]);

    const handleTabChange = (event, newValue) => {
       setCurrentTab(newValue);
    }
    const OnLike = (item) => {
        let value = favorites.find(it => it.collectionId == item.collectionId);

        if (value) {
               let i = searchResult.find(it => it.collectionId == item.collectionId)
                if (i) {
                  item.like = false;
                }
                let remains = favorites.filter((it) => it.collectionId !== item.collectionId);
                setFavorites(remains);
          }
          else {
                let i = searchResult.find(it => it.collectionId == item.collectionId)
                if (i) {
                  item.like = true;
                }
                setFavorites([...favorites, item]);
                }
    }      


    return (
        <React.Fragment>
            <AppBar position ="fixed">
                <Typography align='center' variant='h3' color='inherit'>Favorite Music</Typography>
            </AppBar>

            <div style={{height: 60, width: '100%'}}></div>
            <Box sx={{ borderBottom: 1, borderColor: 'diviser'}}>
                <Tabs 
                    value={currentTab}
                    onChange={handleTabChange}
                    aria-label="basic tabs"
                    centered
                >
                    <Tab label="Search Music" value={0} />
                    <Tab label="Favorites" value={1} />
                    <Tab label="More Contents" value={2} />
                </Tabs>
            </Box>

            {currentTab == 0 && <SearchPage list={searchResult} onSearch={setSearchResult} onLike={OnLike}/>}
            {currentTab == 1 && 
                <Favorites 
                    list={favorites}
                    onLike={OnLike}
                />
            }
            {currentTab == 2 && 
                <Typography align="center" variant="h2"> Item Three</Typography>}

        </React.Fragment>
    )
}

