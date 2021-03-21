import React from "react";
import "../styles/Cardstyles.css"

import profpic from "../images/profpic.svg"
import { useHistory } from "react-router";

export const Card = ({ id, name, creator, last_updated, created_at, image }) => {

    const history = useHistory();

    const goToRoom = () => {
        history.push(`/room/${id}`);
    }

    return (
        <>
            <div className="col-3">
                <div id="card-container" onClick={goToRoom} style={{cursor: "pointer"}}>
                    <b className="project-name">{name}</b>
                    <div className="row" id="project-info">
                        <div className="col-3">
                            <img src={profpic}></img>
                        </div>

                        <div className="col-9">
                            {creator}<br /> about {last_updated}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}