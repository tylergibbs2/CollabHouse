import { BrowserRouter as Router, Route, Switch, useHistory } from "react-router-dom";
import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { RoomPage } from "./pages/RoomPage";
import { DashboardPage } from "./pages/DashboardPage";
import axios from "axios";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export const App = () => {

    const [authed, setAuthed] = useState(false);
    const history = useHistory();

    useEffect(() => {
        axios.get("/api/user")
            .then(resp => {
                setAuthed(resp.data.result);
            })
            .catch((error) => {
                setAuthed(false);
            })
    }, [])

    return (
        <Router>
            <Switch>
                <Route exact path="/">
                    <HomePage authed={authed} setAuthed={setAuthed} />
                </Route>
                <Route exact path="/login">
                    <LoginPage authed={authed} setAuthed={setAuthed} />
                </Route>
                <Route exact path="/register">
                    <RegisterPage authed={authed} setAuthed={setAuthed} />
                </Route>
                <Route exact path="/room/:id">
                    <RoomPage authed={authed} setAuthed={setAuthed} />
                </Route>
                <Route exact path="/dashboard">
                    <DashboardPage authed={authed} setAuthed={setAuthed} />
                </Route>
            </Switch>
        </Router>
    )
}