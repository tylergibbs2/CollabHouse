import { useHistory } from "react-router"
import axios from "axios";
import { useForm } from "react-hook-form";
import logo from "../images/logo.svg"
import { HeaderButtons } from "../components/HeaderButtons";

export const RegisterPage = ({ authed, setAuthed }) => {
    const { register, handleSubmit } = useForm();

    const history = useHistory();

    if (authed)
        history.push("/dashboard");

    const registerUser = (data) => {
        if (data.password !== data.confpassword)
            return;

        let request = {
            "name": `${data.fname} ${data.lname}`,
            "email": data.email,
            "password": data.password
        }

        axios.post("/api/register", request)
            .then(resp => {
                if ("result" in resp.data) {
                    setAuthed(resp.data.result);
                    history.push("/dashboard");
                }
            })
            .catch((error) => {
                console.log("failed to register: " + error);
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
                <form onSubmit={handleSubmit(registerUser)}>
                    <div className="mb-3">
                        <label class="form-label">First name</label>
                        <input name="fname" type="text" className="form-control" placeholder="John" required ref={register} />
                    </div>

                    <div className="mb-3">
                        <label class="form-label">Last name</label>
                        <input name="lname" type="text" className="form-control" placeholder="Doe" required ref={register} />
                    </div>

                    <div className="mb-3">
                        <label class="form-label">Email address</label>
                        <input name="email" type="email" className="form-control" placeholder="john.doe@gmail.com" required ref={register} />
                    </div>

                    <div className="mb-3">
                        <label class="form-label">Password</label>
                        <input name="password" type="password" className="form-control" placeholder="********" required ref={register} />
                    </div>

                    <div className="mb-3">
                        <label class="form-label">Confirm password</label>
                        <input name="confpassword" type="password" className="form-control" placeholder="********" required ref={register} />
                    </div>
                    <button type="submit" className="btn btn-success">Register</button>
                </form>
            </div>
        </>
    )
}