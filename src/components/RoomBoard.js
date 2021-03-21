import React, { useState, useMemo, useRef, useEffect } from "react";
import useWebSocket from "react-use-websocket";
import Cookies from "js-cookie";
import {
    Menu,
    Item,
    Submenu,
    useContextMenu
} from "react-contexify";
import "react-contexify/dist/ReactContexify.css";

import { AddButton } from "./AddButton";
import { Cursor } from "./Cursor";
import { RoomComponent } from "./RoomComponent";
import { useForm } from "react-hook-form";
import { AddModal } from "./AddModal";


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




export const RoomBoard = ({ room_id, userJoin, userLeave, setRoomInfo, roomInfo }) => {
    let ws_host = location.hostname + (location.port ? `:${location.port}` : "");

    let mouseMovementCount = 0;

    const CTX_MENU = "element-manage";

    const { show } = useContextMenu({
        id: CTX_MENU
    });

    const [socketUrl, setSocketUrl] = useState(`ws://${ws_host}/room/${room_id}/ws`);
    const [components, setComponents] = useState([]);
    const [cursors, setCursors] = useState({});
    const [userInfo, setUserInfo] = useState({});
    const [addingComponent, setAddingComponent] = useState(null);

    const messageHistory = useRef([]);

    const { sendJsonMessage, lastMessage } = useWebSocket(socketUrl);

    messageHistory.current = useMemo(() =>
        messageHistory.current.concat(lastMessage), [lastMessage]
    );

    const newComponent = ({ e, props, trigger, data }) => {
        setAddingComponent(data);
    }

    const deleteComponent = ({ e, props, trigger, data }) => {
        let toDelete = props.id;

        let newComponents = removeByAttr(components, "id", toDelete);
        setComponents(newComponents);

        sendJsonMessage({
            "method": "component_delete",
            "params": [toDelete]
        });
    }

    const editComponent = ({ e, props, trigger, data }) => {
        return;
        let toDelete = props.id;

        sendJsonMessage({
            "method": "component_delete",
            "params": [toDelete]
        });
    }

    useEffect(() => {
        if (lastMessage === null)
            return;

        let data = JSON.parse(lastMessage.data)
        if ("components" in data) {
            setComponents(data["components"]);
            setRoomInfo(data["info"]);
            setUserInfo(data["user_info"]);
            return;
        }

        if (data["method"] === "new_component") {
            let new_component = data["params"][0];
            setComponents(components.concat(new_component));
        } else if (data["method"] === "mouse_move") {
            let identity = data["params"][0]
            let name = data["params"][1]
            let x = data["params"][2];
            let y = data["params"][3];

            cursors[identity] = <Cursor key={identity} user_id={identity} name={name} x={x} y={y} />
            setCursors(cursors);
        } else if (data["method"] === "user_join") {
            userJoin(...data["params"]);
        } else if (data["method"] === "user_leave") {
            userLeave(...data["params"]);
        } else if (data["method"] === "name_update") {
            let newName = data["params"][0];
            let creator = roomInfo["creator_name"]
            setRoomInfo({
                room_name: newName,
                creator_name: creator
            });
        } else if (data["method"] === "component_delete") {
            let deletedId = data["params"][0];
            let newComponents = removeByAttr(components, "id", deletedId);
            setComponents(newComponents);
        }

    }, [lastMessage])

    const mouseMove = (e) => {
        mouseMovementCount++;
        if (mouseMovementCount % 25 !== 0)
            return;

        let container = document.getElementById("room-container");
        let rect = container.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        let token = Cookies.get("access_token_cookie");
        let params;
        if (token)
            params = [token, x, y];
        else
            params = [{ identity: userInfo.identity, name: userInfo.name }, x, y];

        sendJsonMessage({
            "method": "mouse_move",
            "params": params
        });
    }

    const elementContext = (e, id) => {
        show(e, { props: { id: id } });
    }

    const createComponent = (data) => {
        sendJsonMessage({
            "method": "component_add",
            "params": [addingComponent, data.content]
        });

        stopAddingComponent();
    }

    const stopAddingComponent = () => {
        setAddingComponent(null);
    }

    return (
        <>
            <AddModal createComponent={createComponent} addingComponent={addingComponent} stopAddingComponent={stopAddingComponent} />

            <div id="room-container" onContextMenu={show} className="bg-light" onMouseMove={mouseMove} style={{ position: "relative", height: "100%", width: "100%", overflow: "scroll", boxSizing: "border-box" }}>
                {
                    Object.values(cursors)
                }
                {
                    components.map((c) => (
                        <RoomComponent onContextMenu={elementContext} key={c.id} send={sendJsonMessage} lastMessage={lastMessage} component={c} />
                    ))
                }
                <AddButton send={sendJsonMessage} />
            </div>

            <Menu id={CTX_MENU}>
                <Submenu label="New">
                    <Item onClick={newComponent} data={"link"}>Link</Item>
                    <Item onClick={newComponent} data={"image"}>Image</Item>
                    <Item onClick={newComponent} data={"video"}>Video</Item>
                    <Item onClick={newComponent} data={"text"}>Text</Item>
                    <Item onClick={newComponent} data={"title"}>Title</Item>
                    <Item onClick={newComponent} data={"code"}>Code block</Item>
                </Submenu>
                <Item onClick={editComponent}>
                    Edit
                </Item>
                <Item onClick={deleteComponent}>
                    Delete
                </Item>
            </Menu>
        </>
    )
}