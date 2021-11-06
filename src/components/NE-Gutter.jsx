import { BsBraces, BsChevronDown, BsChevronRight, BsCodeSlash, BsFillPinFill, BsMarkdown, BsPin, BsSlashCircle, BsXLg } from "react-icons/bs";

import { NotebookEntryType_HTML, NotebookEntryType_JAVASCRIPT, NotebookEntryType_MARKDOWN, NotebookEntryType_TEX } from "./NotebookEntryType";
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

    switch (props.type) {
        case NotebookEntryType_HTML:
            return <div className="NE-Gutter-focus" onClick={props.onClick}><BsCodeSlash size="0.7em" />{props.children}</div>;
        case NotebookEntryType_JAVASCRIPT:
            return <div className="NE-Gutter-focus" onClick={props.onClick}><BsBraces size="0.7em" />{props.children}</div>;
        case NotebookEntryType_MARKDOWN:
            return <div className="NE-Gutter-focus" onClick={props.onClick}><BsMarkdown size="0.7em" />{props.children}</div>;
        case NotebookEntryType_TEX:
            return <div className="NE-Gutter-focus" onClick={props.onClick}><BsSlashCircle size="0.7em" />{props.children}</div>;
        default:
            return <div className="NE-Gutter-focus" onClick={props.onClick}><BsXLg size="0.7em" />{props.children}</div>;

    }
}

