import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { RoomComponentInner } from "./RoomComponentInner";


export const RoomComponent = ({ onContextMenu, send, lastMessage, component }) => {

    const [xPos, setXPos] = useState(component.x_pos);
    const [yPos, setYPos] = useState(component.y_pos);

    const [width, setWidth] = useState(component.width);
    const [height, setHeight] = useState(component.height);

    const updatePos = (component_id, newX, newY) => {
        if (component_id !== component.id)
            return;

        setXPos(newX);
        setYPos(newY);
    }

    const updateSize = (component_id, newWidth, newHeight) => {
        if (component_id !== component.id)
            return;

        setWidth(newWidth);
        setHeight(newHeight);
    }

    useEffect(() => {
        if (lastMessage === null)
            return;

        let data = JSON.parse(lastMessage.data)
        switch (data.method) {
            case "component_drag":
                updatePos(...data.params);
                break;
            case "component_resize":
                updateSize(...data.params);
                break;
        }
    }, [lastMessage]);

    const dragEnd = (e, data) => {
        setXPos(data.x);
        setYPos(data.y);
        send({
            "method": "component_drag_end",
            "params": [component.id, data.x, data.y]
        })
    }

    const dragging = (e, data) => {
        send({
            "method": "component_drag",
            "params": [component.id, data.x, data.y]
        })
    }

    const resizeEnd = (e, dir, ref, delta, position) => {
        setXPos(position.x);
        setYPos(position.y);

        setWidth(ref.offsetWidth);
        setHeight(ref.offsetHeight);

        send({
            "method": "component_drag_end",
            "params": [component.id, xPos, yPos]
        })
        send({
            "method": "component_resize_end",
            "params": [component.id, width, height]
        })
    }

    const resizing = (e, dir, ref, delta, position) => {
        setXPos(position.x);
        setYPos(position.y);

        setWidth(ref.offsetWidth);
        setHeight(ref.offsetHeight);

        send({
            "method": "component_drag",
            "params": [component.id, xPos, yPos]
        })
        send({
            "method": "component_resize",
            "params": [component.id, width, height]
        })
    }

    const chooseContext = (e) => {
        onContextMenu(e, component.id);
    }

    return (
        <Rnd
            style={{overflow: "hidden"}}
            onDrag={dragging}
            onDragStop={dragEnd}
            onResize={resizing}
            onResizeStop={resizeEnd}
            bounds="parent"
            position={{x: xPos, y: yPos}}
            size={{width: width, height: height}}
        >
            <RoomComponentInner onContextMenu={chooseContext} type={component.type} content={component.content} contentExtra={component.content_extra} />
        </Rnd>
    )
}