import { RoomBoard } from "../components/RoomBoard"
import { User } from "../components/User"
import "../styles/roomstyles.css"
import profpic from "../images/profpic.svg"
import { useState } from "react"
import darkicon from "../images/darkicon.svg";
import lighticon from "../images/lighticon.svg";
import { useParams } from "react-router"
import { HeaderButtons } from "../components/HeaderButtons"
import axios from "axios";
import { useContextMenu } from "react-contexify"

const removeByAttr = (arr, attr, val) => {
    let i = arr.length;
    while (i--) {
        if (
            arr[i] &&
            arr[i].hasOwnProperty(attr) &&
            arr[i][attr] === val
        )
            arr.splice(i, 1);
    }
    return arr;
}


export const RoomPage = ({ authed, setAuthed }) => {

    let { id } = useParams();

    if (!("darkmode" in localStorage))
        localStorage["darkmode"] = "false";

    const [isDarkTheme, setDarkTheme] = useState(JSON.parse(localStorage["darkmode"]));
    const [users, setUsers] = useState([]);
    const [roomInfo, setRoomInfo] = useState({});
    const { show } = useContextMenu({ id: "element-manage"});

    const updateName = (e) => {
        let newName = e.target.value;
        let request = {
            "name": newName
        };

        axios.post(`/room/${id}/update`, request);
    }

    const userJoin = (identity, name) => {
        let newUsers = [{ identity: identity, name: name, image: profpic }, ...users];
        setUsers(newUsers);
    }

    const userLeave = (identity, name) => {
        let newUsers = removeByAttr(users, "identity", identity);
        setUsers(newUsers);
    }

    function darkThemeHandler() {
        setDarkTheme(!isDarkTheme);
        let setting = JSON.parse(localStorage["darkmode"]);
        localStorage["darkmode"] = JSON.stringify(!setting);
    }

    return (
        <>
            <div id="wrapper" style={isDarkTheme === true ? { background: "#0D110D" } : { background: "#F6F6F7" }}>
                <div style={isDarkTheme === true ? { background: "#0D110D" } : { background: "#F6F6F7" }} className="container-fluid" id="home-header">
                    <div className="row">
                        <div style={isDarkTheme === true ? { background: "#0D110D" } : { background: "#F6F6F7" }} className="col" id="header-logo">
                            <h1 style={isDarkTheme === true ? { color: "white", backgroundColor: "#0D110D" } : { fontFamily: "Teko" }}>CollabHouse</h1>
                        </div>
                        <div style={isDarkTheme === true ? { background: "#0D110D" } : { background: "#F6F6F7" }} className="col" id="header-btns">
                            <HeaderButtons authed={authed} setAuthed={setAuthed} isDarkTheme={isDarkTheme} />
                        </div>
                    </div>
                </div>
                <div style={isDarkTheme === true ? { backgroundColor: "#0D110D", marginBottom:"15px" } : { backgroundColor: "#F6F6F7" }} className="container" id="session-info-container">
                    <div style={isDarkTheme === true ? { background: "#0D110D" } : { background: "#F6F6F7" }} className="row" id="session-info-row1">
                        <p style={isDarkTheme === true ? { color: "white", background: "#0D110D" } : { color: "black" }}><img style={isDarkTheme === true ? { background: "#0D110D" } : { background: "#F6F6F7" }} src={profpic}></img> {roomInfo ? roomInfo.creator_name : "Guest"}</p>
                    </div>
                    <div style={isDarkTheme === true ? { background: "#0D110D" } : { background: "#F6F6F7" }} className="row" id="session-info-row2">
                        <div style={isDarkTheme === true ? { color: "white", backgroundColor: "#0D110D" } : { color: "black" }} className="col" id="session-info-title">
                            <input onChange={updateName} maxLength="20" className={isDarkTheme ? "bg-dark text-white" : ""} type="text" value={roomInfo ? roomInfo.room_name : "Placeholder"}></input>
                        </div>
                        <div style={isDarkTheme === true ? { backgroundColor: "#0D110D" } : { background: "#F6F6F7" }} className="col" id="session-info-participants">
                            {users.map((user) => (
                                <User
                                    key={user.identity}
                                    id={user.identity}
                                    name={user.name}
                                    image={user.image}
                                    isDarkTheme={isDarkTheme}
                                />
                            ))
                            }

                        </div>
                        <div style={isDarkTheme === true ? { background: "#0D110D" } : { background: "#F6F6F7" }} className="col" id="dark-mode">
                            <img style={isDarkTheme === true ? {cursor: "pointer"} : { background: "#F6F6F7", cursor: "pointer" }} onClick={darkThemeHandler} src={isDarkTheme ? darkicon : lighticon} id="dark-icon"></img>
                        </div>
                    </div>
                </div>
                <div onContextMenu={show} style={isDarkTheme === true ? { backgroundColor: "#0D110D" } : { background: "#F6F6F7" }} id="board-container" style={{ height: "800px", width: "1600px", overflow: "hidden", margin: "0 auto" }}>
                    <RoomBoard
                        room_id={id}
                        userJoin={userJoin}
                        userLeave={userLeave}
                        setRoomInfo={setRoomInfo}
                        roomInfo={roomInfo}
                    />
                </div>
            </div>
        </>
    )
}