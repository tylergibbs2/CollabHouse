import { useHistory } from "react-router"
import Cookies from "js-cookie";
import axios from "axios";

export const HeaderButtons = ({authed, setAuthed, isDarkTheme}) => {

    const history = useHistory();

    const toRegister = () => {
        history.push("/register");
    }

    const toLogin = () => {
        history.push("/login");
    }

    const logout = () => {
        let opts = {
            withCredentials: true,
            headers: {
                "X-CSRF-TOKEN": Cookies.get("jwt_csrf_token")
            }
        };

        axios.delete("/api/logout", opts)
            .then(resp => {
                history.push("/");
                setAuthed(false);
            })
            .catch((error) => {
                console.log("failed to logout: " + error);
            })
    }

    if (authed) {
        return (
            <button className="login-btn" style={isDarkTheme === true ? { color: "white", backgroundColor: "black", borderColor: "white" } : { color: "black", backgroundColor: "#F6F6F7", borderColor: "black" }} onClick={logout}>Log out</button>
        )
    } else {
        return (
            <>
                <button className="register-btn" style={isDarkTheme === true ? { color: "white", backgroundColor: "black", borderColor: "white" } : { color: "black", backgroundColor: "#F6F6F7", borderColor: "black" }} onClick={toRegister}>Sign up</button>
                <button className="login-btn" style={isDarkTheme === true ? { color: "white", backgroundColor: "black", borderColor: "white" } : { color: "black", backgroundColor: "#F6F6F7", borderColor: "black" }} onClick={toLogin}>Log in</button>
            </>
        )
    }
}