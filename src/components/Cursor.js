import "../styles/Cursorstyles.css"
import blankpointer from "../images/blank-pointer.svg";
import pointer from "../images/newptr.svg";
import ColorHash from 'color-hash'
import { ReactImageTint } from 'react-image-tint';

export const Cursor = ({ user_id, name, x, y }) => {

    const getUserColor = (id) => {
        let hasher = new ColorHash();
        let color = hasher.hex(id);
        return color;
    }
    let userColor = getUserColor(user_id)
    return (
        <>
            <div className="cursor" style={{ top: y, left: x, color:userColor, backgroundColor:userColor}}>
                <b className="project-name">{name}</b>
            </div>


        </>

    )
}