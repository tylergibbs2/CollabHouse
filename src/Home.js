import { useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import useWebSocket from "react-use-websocket";
import Cookies from "js-cookie";

export const Home = () => {
    const [socketUrl, setSocketUrl] = useState(`ws://${location.hostname}:5000/api/ws`);
    const messageHistory = useRef([]);

    const { sendJsonMessage, lastMessage } = useWebSocket(socketUrl);

    messageHistory.current = useMemo(() =>
        messageHistory.current.concat(lastMessage), [lastMessage]);

    const test = useCallback(() => {
        sendJsonMessage({
            "method": "test",
            "params": ["foo"],
            "access_token": Cookies.get("access_token_cookie")
        });
    })

    const login = () => {
        let request = {
            "email": "gibbstyler7@gmail.com",
            "password": "test"
        }
        axios.post("/api/login", request)
            .then(resp => {
                console.log(resp.data);
            })
    }

    let opts = {
        withCredentials: true,
        headers: {
            "X-CSRF-TOKEN": Cookies.get("jwt_csrf_token")
        }
    };

    const logout = () => {
        axios.delete("/api/logout", opts)
            .then(resp => {
                console.log(resp.data);
            })
    }

    return (
        <>
            <button onClick={login}>login</button>
            <button onClick={logout}>logout</button>
            <button onClick={test}>ws test</button>
            <p>{lastMessage ? lastMessage.data : null}</p>
        </>
    )
}