import React, { useEffect, useState } from "react";
import "../styles/Dashstyles.css"
import { Card } from "../components/Card"
import axios from "axios";
import logo from "../images/logo.svg"
import { useHistory } from "react-router";
import { HeaderButtons } from "../components/HeaderButtons";

export const DashboardPage = ({authed, setAuthed}) => {

    const [projects, setProjects] = useState([]);

    let history = useHistory();

    const createRoom = () => {
        axios.post("/room/create")
            .then(resp => {
                let url = `/room/${resp.data.result}`;
                history.push(url);
            })
            .catch((error) => {
                console.log("failed to create room: " + error);
            })
    }

    useEffect(() => {
        axios.get("/api/rooms")
            .then(resp => {
                setProjects(resp.data.result);
            })
            .catch((error) => {
                console.log("failed to get projects: " + error);
            })
    }, [])

    return (
        <>
            <div className="container-fluid" id="home-header">
                <div className="row">
                    <div className="col" id="header-logo">
                        <a href="/"><img src={logo}></img></a>
                    </div>
                    <div className="col" id="header-btns">
                        <HeaderButtons authed={authed} setAuthed={setAuthed} />
                    </div>
                </div>
            </div>
            <div className="container">
                <h1 style={{ textAlign: "center" }}>Hi, <b>{authed ? authed.name : null}</b> <br />Welcome to Collabhouse!</h1>
            </div>
            <div className="container" id="btn-container">
                <button className="new-proj-btn" onClick={createRoom}>CREATE NEW PROJECT</button>
                <button className="join-proj-btn" >JOIN A PROJECT</button>
                <button className="gallery-btn" >GALLERY</button>
            </div>
            <div className="container" id="project-container">
                <div className="row">
                    {projects.map((room) => (
                        <Card
                            key={room.id}
                            id={room.id}
                            name={room.name}
                            creator={room.creator}
                            last_updated={room.last_updated}
                            created_at={room.created_at}
                            image={room.image} />
                    ))
                    }
                </div>
            </div>
        </>
    )
}