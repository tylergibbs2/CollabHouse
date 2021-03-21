import "../styles/HomeStyles.css"
import slacklogo from "../images/slack.svg"
import discordlogo from "../images/discord.svg"
import purplepointer from "../images/purple-pointer.svg"
import bluepointer from "../images/blue-pointer.svg"
import logo from "../images/logo.svg"
import { HeaderButtons } from "../components/HeaderButtons";
import { useHistory } from "react-router";

export const HomePage = ({authed, setAuthed}) => {

    const history = useHistory();

    const getStarted = () => {
        if (authed)
            history.push("/dashboard");
        else
            history.push("/register");
    }

    return (
        <>
            <div className="container-fluid" id="home-header">
                <div className="row">
                    <div className="col" id="header-logo">
                        <img src={logo}></img>
                    </div>
                    <div className="col" id="header-btns">
                        <HeaderButtons authed={authed} setAuthed={setAuthed} />
                    </div>
                </div>
            </div>
            <div className="container" id="banner-container">
                <div className="row" id="toppointer"><img src={purplepointer}></img></div>
                <div className="row" id="banner-lg-text"><p>Where Collaboration<br /> Meets Simplicity</p></div>
                <div className="row" id="banner-sm-text">
                    <div className="col-4" id="banner-sm-text-col1">
                        <img id="bottompointer" src={bluepointer}></img>
                    </div>
                    <div className="col-8" id="banner-sm-text-col2">
                        <p>CollabHouse Increases Efficiency <br /> By Organizing Your Team's Projects</p>
                    </div>
                </div>
                <div className="row"><button className="home-btn" onClick={getStarted}>Get Started!</button></div>
                <div className="row" id="banner-md-text"><p>Available Integrations</p></div>
                <div className="row" id="integration-logos"><img src={slacklogo}></img><img src={discordlogo}></img></div>
            </div>
        <div className="container-fluid" id="footer">

        </div>
        </>
    )
}