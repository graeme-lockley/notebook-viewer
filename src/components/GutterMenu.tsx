import { BsArrowDownSquare, BsArrowUpSquare, BsThreeDotsVertical, BsTrash } from "react-icons/bs";
import { CgInsertAfterR, CgInsertBeforeR } from "react-icons/cg";
import { Gutter } from "./NE-Gutter";

export interface Me {
    state: { focus: boolean; menuPopup: boolean };

    insertBeforeEntry: () => void;
    addAfterEntry: () => void;
    moveEntryUp: () => void;
    moveEntryDown: () => void;
    deleteEntry: () => void;
    attemptToggleMenuPopup: () => void;
}

export interface GutterMenuProps {
    this: Me;
}

export function GutterMenu(props: GutterMenuProps) {
    const me = props.this;
    const state = me.state;

    if (!state.focus)
        return (<Gutter focus={false} />);

    return (
        <div className="NE-Gutter-focus NE-Pointer" onClick={me.attemptToggleMenuPopup}><BsThreeDotsVertical size="0.7em" />
            {state.menuPopup &&
                <div className="NE-Popup">
                    <div className="NE-PopupEntry" onClick={me.insertBeforeEntry}><CgInsertAfterR size="0.7em" /> Insert before</div>
                    <div className="NE-PopupEntry" onClick={me.addAfterEntry}><CgInsertBeforeR size="0.7em" /> Add after</div>
                    <div className="NE-PopupEntry" onClick={me.moveEntryUp}><BsArrowUpSquare size="0.7em" /> Move up</div>
                    <div className="NE-PopupEntry" onClick={me.moveEntryDown}><BsArrowDownSquare size="0.7em" /> Move down</div>
                    <hr />
                    <div className="NE-PopupEntry" onClick={me.deleteEntry}><BsTrash size="0.7em" /> Delete</div>
                </div>
            }
        </div>);
}