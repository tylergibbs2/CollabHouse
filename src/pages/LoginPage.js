import { useHistory } from "react-router"
import axios from "axios";
import { useForm } from "react-hook-form";
import logo from "../images/logo.svg"
import { HeaderButtons } from "../components/HeaderButtons";

export const LoginPage = ({authed, setAuthed}) => {
    const { register, handleSubmit } = useForm();

    const history = useHistory();

    if (authed)
        history.push("/dashboard");

    const login = (data) => {
        let request = {
            "email": data.email,
            "password": data.password
        }

        axios.post("/api/login", request)
            .then(resp => {
                if ("result" in resp.data) {
                    setAuthed(resp.data.result);
                    history.push("/dashboard");
                }
            })
            .catch((error) => {
                console.log("failed to login: " + error);
            })
    }

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
            <div className="container" style={{width: "50%"}}>
                <form onSubmit={handleSubmit(login)}>
                    <div className="mb-3">
                        <label class="form-label">Email address</label>
                        <input name="email" type="email" className="form-control" placeholder="john.doe@gmail.com" required ref={register} />
                    </div>

                    <div className="mb-3">
                        <label class="form-label">Password</label>
                        <input name="password" type="password" className="form-control" placeholder="********" required ref={register} />
                    </div>
                    <button type="submit" className="btn btn-primary">Login</button>
                </form>
            </div>
        </>
    )
}