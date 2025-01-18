import React from "react";
import MusicList from "./MusicList";

const Favorites = ({list, onLike}) => {
    return(
        <div>
            <MusicList list={list} onLike={onLike} />
        </div>
    )
}

export default Favorites;