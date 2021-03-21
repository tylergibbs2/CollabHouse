import hljs from "highlight.js";
import 'highlight.js/styles/github.css';
import ReactHtmlParser from "react-html-parser";
import "../styles/innerstyles.css"


export const RoomComponentInner = ({onContextMenu, type, content, contentExtra}) => {
    let inner;

    if (type === "text")
        inner = <p>{content}</p>;
    else if (type === "code") {
        let res = hljs.highlightAuto(content);
        inner = <pre>{ ReactHtmlParser(res.value) }</pre>
    } else if (type === "video") {
        inner = <iframe frameBorder="0" height="100%" width="100%" src={content} allowFullScreen></iframe>
    } else if (type === "image") {
        inner = <img src={content} width="100%" draggable="false"></img>
    } else if (type === "link") {
        inner = <a href={content}>{contentExtra ? contentExtra : content}</a>
    } else if (type === "contact") {
        let re = /\S+@\S+\.\S+/;
        if (re.test(content))
            inner = <a href={`mailto:${content}`}>{content}</a>
        else
            inner = <p>{content}</p>
    } else if (type === "title")
        inner = <h2>{content}</h2>

    return (
        <div onContextMenu={onContextMenu} style={{ margin: 0, height: "100%", overflow: "auto", padding: "10px"}}>
            {inner}
        </div>
    )
}