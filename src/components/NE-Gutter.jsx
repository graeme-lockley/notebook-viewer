import { BsBraces, BsChevronDown, BsChevronRight, BsCodeSlash, BsFillPinFill, BsPin } from "react-icons/bs";

import { NotebookEntryType_HTML } from "./NotebookEntryType";
import "./NE-Gutter.css"

export function Gutter(props) {
    return <div className={`NE-Gutter${props.focus ? "-focus" : ""}`} />
}

export function GutterChevron(props) {
    if (!props.focus)
        return <Gutter focus={false} />

    if (!props.open)
        return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsChevronRight size="0.7em" /></div>

    if (props.pinned)
        return <div className="NE-Gutter-focus" onClick={props.onClick}><BsChevronDown size="0.7em" /></div>

    return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsChevronDown size="0.7em" /></div>
}

export function GutterPin(props) {
    if (!props.focus)
        return <Gutter focus={false} />

    if (props.pinned)
        return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsFillPinFill size="0.7em" /></div>

    return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsPin size="0.7em" /></div>
}

export function GutterEntryType(props) {
    if (!props.focus)
        return <Gutter focus={false} />

    return (props.type === NotebookEntryType_HTML)
        ? <div className="NE-Gutter-focus" onClick={props.onClick}><BsCodeSlash size="0.7em" />{props.children}</div>
        : <div className="NE-Gutter-focus" onClick={props.onClick}><BsBraces size="0.7em" />{props.children}</div>;
}

