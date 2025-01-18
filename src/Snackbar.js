import React from "react";

import {Snackbar} from '@mui/material';

const SnackMsg = (props) => {
    return (
        <Snackbar
            open={props.open}
            anchorOrigin={{vertical : 'bottom', horizontal : 'right'}}
            autoHideDuration={3000}
            onClose={props.onClose}
            message={props.message}>
        </Snackbar>
    )
}

export default SnackMsg;