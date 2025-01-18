import React from "react";
import {Card, CardContent, CardActions, Typography, IconButton} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import SnackMsg from './Snackbar';  

const styles ={
    content: {},
    layout: {
        display : 'flex',
        justifyContent : 'center'
    },
    card: {
        midWidth: 275,
        maxWidth: 600,
        marginBottom: "20pt",
        marginLeft: 'auto',
        marginRight: 'auto',
    },
};

export default function MusicList ({list, onLike}) {
    let [snackState, setSnackState] = React.useState({open : false, msg : ''});

    const toggleFavorite = (item) => () => {onLike(item)} 


    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
              return;
        }      
        setSnackState({open : false, msg : ''});
        <SnackMsg 
            open = {snackState.open} 
            message={snackState.msg} 
            onClose={handleSnackbarClose}
        />
    }     

    return(
        <div>
            {list.map(item => {
                return (
                    <Card sx={styles.card} key={item.colloectionId}>
                        <CardContent>
                            <Typography variant="subtitle1"> {item.artistName}</Typography>
                            <Typography variant="subtitle2"> {item.collectionCensoredName}</Typography>
                        </CardContent>
                        <CardActions>
                            <IconButton onClick={toggleFavorite(item)}>
                                {item.like ?
                                    <Favorite /> : <FavoriteBorder /> }
                            </IconButton>
                        </CardActions>
                    </Card>
                )
            })}
        </div>
    )
}