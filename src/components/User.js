import "../styles/userstyles.css"
import ColorHash from "color-hash";


const getUserColor = (id) => {
    let hasher = new ColorHash();
    let color = hasher.hex(id);
    return color;
}


export const User = ({ id, name, image, isDarkTheme }) => {
    let color = getUserColor(id);

    return (
        <div style={isDarkTheme === true ? { backgroundColor: "#F6F6F7" } : { backgroundColor: "#0D110D" }} id="userelem" style={{ display: "inline-flex", borderColor: color }}>
            <p style={isDarkTheme === true ? { backgroundColor: "#0D110D", color: color } : { background: "#F6F6F7", color:color }}>
                <img style={isDarkTheme===true ? { display: "inline-flex", borderColor: color, backgroundColor:"#0D110D" }: {display: "inline-flex", borderColor: color}} src={image}>
                </img> {name}
            </p>
        </div>
    )

}