import { BsBraces, BsChevronDown, BsChevronRight, BsCodeSlash, BsFillPinFill, BsMarkdown, BsPin, BsSlashCircle, BsXLg } from "react-icons/bs";

import { EntryType } from "../model/notebook";
import "./NE-Gutter.css"

export interface GutterProps {
    focus: boolean;
}

export function Gutter(props: GutterProps) {
    return <div className={`NE-Gutter${props.focus ? "-focus" : ""}`} />
}

export interface GutterChevronProps {
    focus: boolean;
    open: boolean;
    pinned: boolean;

    onClick: () => void;
}

export function GutterChevron(props: GutterChevronProps) {
    if (!props.focus)
        return <Gutter focus={false} />

    if (!props.open)
        return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsChevronRight size="0.7em" /></div>

    if (props.pinned)
        return <div className="NE-Gutter-focus" onClick={props.onClick}><BsChevronDown size="0.7em" /></div>

    return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsChevronDown size="0.7em" /></div>
}

export interface GutterPinProps {
    focus: boolean;
    pinned: boolean;

    onClick: () => void;
}

export function GutterPin(props: GutterPinProps) {
    if (!props.focus)
        return <Gutter focus={false} />

    if (props.pinned)
        return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsFillPinFill size="0.7em" /></div>

    return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsPin size="0.7em" /></div>
}

export interface GutterEntryTypeProps {
    focus: boolean;
    type: EntryType;

    children: any;

    onClick: () => void;
}

export function GutterEntryType(props: GutterEntryTypeProps) {
    if (!props.focus)
        return <Gutter focus={false} />

    switch (props.type) {
        case EntryType.HTML:
            return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsCodeSlash size="0.7em" />{props.children}</div>;
        case EntryType.JAVASCRIPT:
            return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsBraces size="0.7em" />{props.children}</div>;
        case EntryType.MARKDOWN:
            return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsMarkdown size="0.7em" />{props.children}</div>;
        case EntryType.TEX:
            return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsSlashCircle size="0.7em" />{props.children}</div>;
        default:
            return <div className="NE-Gutter-focus NE-Pointer" onClick={props.onClick}><BsXLg size="0.7em" />{props.children}</div>;
    }
}

