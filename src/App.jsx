import React from "react"
import { BsArrowDownSquare, BsArrowUpSquare, BsBraces, BsCodeSlash, BsMarkdown, BsSlashCircle, BsThreeDotsVertical, BsTrash } from "react-icons/bs";
import { CgInsertAfterR, CgInsertBeforeR } from "react-icons/cg";
import "./App.css";
import { CodeMirror } from "./components/CodeMirror";
import { Gutter, GutterChevron, GutterEntryType, GutterPin } from "./components/NE-Gutter";
import { FileAttachments, Library } from "@observablehq/stdlib";
import { CalculationPolicy, Runtime } from "./Runtime";
import { parseCell } from "@observablehq/parser/src/parse.js"
import { stringify } from "flatted"

import { EntryType, addAfter, insertBefore } from "./model/notebook"
import { notebook } from "./model/initial"

const library = new Library()

class EntryResults extends React.Component {
    constructor(props) {
        super(props);

        this.elementRef = (element, newThis) => {
            if (element !== null && newThis.props.result.dom !== undefined) {
                element.childNodes.forEach(child => {
                    element.removeChild(child);
                });
                element.appendChild(newThis.props.result.dom);
            }
        };
    }

    render() {
        if (this.props.result.dom !== undefined) {
            return (<div
                className={`NotebookBody-${this.props.result.status}`}
                ref={(e) => this.elementRef(e, this)}
            />);
        }

        return (<div
            className={`NotebookBody-${this.props.result.status}`}
            dangerouslySetInnerHTML={{ __html: this.props.result.text }}
        />);
    }
}

const cellObserver = (stuff) => ({
    fulfilled: (cell, value) => {
        stuff.setState(() => {
            if (value instanceof Node)
                return { html: { status: 'OK', dom: value } };
            else if (typeof value === "object" || typeof value === "function")
                return { html: { status: 'OK', text: stringify(value, null, 2) } };
            else
                return { html: { status: 'OK', text: value } };
        });
    },

    pending: () => {
        stuff.setState(() => ({
            html: { status: 'OK', text: 'PENDING' }
        }));
    },

    rejected: (_, error) => {
        stuff.setState(() => ({
            html: { status: 'ERROR', text: error === undefined ? 'Error' : error }
        }));
    }
});

function GutterMenu(props) {
    const me = props.this;
    const state = me.state;

    if (!state.focus)
        return (<Gutter focus={false} />);

    return (
        <div className="NE-Gutter-focus NE-Pointer" onClick={(e) => me.attemptToggleMenuPopup(e)}><BsThreeDotsVertical size="0.7em" />
            {state.menuPopup &&
                <div className="NE-Popup">
                    <div className="NE-PopupEntry" onClick={me.insertBeforeEntry}><CgInsertAfterR size="0.7em" /> Insert before</div>
                    <div className="NE-PopupEntry" onClick={me.addAfterEntry}><CgInsertBeforeR size="0.7em" /> Add after</div>
                    <div className="NE-PopupEntry" onClick={me.moveEntryUp}><BsArrowUpSquare size="0.7em" /> Move up</div>
                    <div className="NE-PopupEntry" onClick={me.moveEntryDown}><BsArrowDownSquare size="0.7em" /> Move down</div>
                    <hr />
                    <div className="NE-PopupEntry" onClick={() => me.deleteEntry()}><BsTrash size="0.7em" /> Delete</div>
                </div>
            }
        </div>);
}

class NotebookEntry extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            model: props.value,
            html: "",
            open: props.value.pinned,
            entryTypePopup: false,
            menuPopup: false,
            focus: false
        };

        this.attemptToggleChevron = this.attemptToggleChevron.bind(this);
        this.attemptTogglePin = this.attemptTogglePin.bind(this);
        this.attemptToggleEntryTypePopup = this.attemptToggleEntryTypePopup.bind(this);
        this.attemptToggleMenuPopup = this.attemptToggleMenuPopup.bind(this);
        this.setEntryType = this.setEntryType.bind(this);
        this.insertBeforeEntry = this.insertBeforeEntry.bind(this);
        this.addAfterEntry = this.addAfterEntry.bind(this);
        this.moveEntryUp = this.moveEntryUp.bind(this);
        this.moveEntryDown = this.moveEntryDown.bind(this);
        this.deleteEntry = this.deleteEntry.bind(this);
        this.focusOn = this.focusOn.bind(this);
        this.focusOff = this.focusOff.bind(this);
        this.changeText = this.changeText.bind(this);


        valueChanged(props.value.type, props.value.text, props.cell);
    }

    attemptToggleChevron() {
        this.setState(state => ({ open: state.model.pinned ? true : !state.open }));
    }

    attemptTogglePin() {
        this.setState(state => {
            const model = { ...state.model, pinned: !state.model.pinned };

            return { model };
        });
    }

    attemptToggleEntryTypePopup(e) {
        this.setState(state => ({ entryTypePopup: state.entryTypePopup === false ? true : false, menuPopup: false }));
    }

    attemptToggleMenuPopup(e) {
        this.setState(state => ({ menuPopup: state.menuPopup === false ? true : false, entryTypePopup: false }));
    }

    setEntryType(et) {
        this.setState(state => {
            const model = { ...state.model, type: et }

            return { model, entryTypePopup: undefined };
        });
    }

    insertBeforeEntry() {
        this.props.insertBeforeEntry(this.props.value.id);
    }

    addAfterEntry() {
        this.props.addAfterEntry(this.props.value.id);
    }

    deleteEntry() {
        this.props.deleteEntry(this.props.value.id);
    }

    moveEntryUp() {
        this.props.moveEntryUp(this.props.value.id);
    }

    moveEntryDown() {
        this.props.moveEntryDown(this.props.value.id);
    }

    componentDidMount() {
        this.props.cell.define([], "");
        this.props.cell.includeObserver(cellObserver(this));
    }

    componentWillUnmount() {
        this.props.cell.remove();
    }

    focusOn() {
        this.setState(() => ({ focus: true }));
    }

    focusOff() {
        this.setState(state => ({ focus: false, entryTypePopup: false, menuPopup: false, open: state.model.pinned }));
    }

    changeText(text) {
        this.setState((state) => {
            valueChanged(state.model.type, text, this.props.cell);
            const model = { ...state.model, text }
            return { model };
        });
    }

    changeEntryType(entryType) {
        this.setState((state) => {
            valueChanged(entryType, state.model.text, this.props.cell);
            const model = { ...state.model, type: entryType }
            return { model };
        });
    }

    calculateMode(type) {
        return type === EntryType.HTML ? "htmlmixed"
            : type === EntryType.JAVASCRIPT ? "javascript"
                : "markdown";
    }

    render() {
        if (this.state.open)
            return (<div className="NotebookEntry" onMouseEnter={this.focusOn} onMouseLeave={this.focusOff}>
                <div className="Upper">
                    <GutterChevron
                        open={this.state.open}
                        pinned={this.state.model.pinned}
                        focus={this.state.focus}
                        onClick={this.attemptToggleChevron} />
                    <GutterMenu this={this} />
                    <EntryResults
                        result={this.state.html} />
                </div>
                <div className="Lower">
                    <GutterPin
                        pinned={this.state.model.pinned}
                        focus={this.state.focus}
                        onClick={this.attemptTogglePin} />
                    <GutterEntryType
                        type={this.state.model.type}
                        focus={this.state.focus}
                        onClick={this.attemptToggleEntryTypePopup}>
                        {this.state.entryTypePopup &&
                            <div className="NE-Popup">
                                <div className={this.state.model.type === EntryType.JAVASCRIPT ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.changeEntryType(EntryType.JAVASCRIPT)}><BsBraces size="0.7em" /> JavaScript</div>
                                <div className={this.state.model.type === EntryType.MARKDOWN ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.changeEntryType(EntryType.MARKDOWN)}><BsMarkdown size="0.7em" /> Markdown</div>
                                <div className={this.state.model.type === EntryType.HTML ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.changeEntryType(EntryType.HTML)}><BsCodeSlash size="0.7em" /> HTML</div>
                                <div className={this.state.model.type === EntryType.TEX ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.changeEntryType(EntryType.TEX)}><BsSlashCircle size="0.7em" /> TeX</div>
                            </div>
                        }
                    </GutterEntryType>
                    <div className="NotebookBody">
                        <CodeMirror
                            value={this.state.model.text}
                            onChange={this.changeText}
                            options={{
                                viewportMargin: Infinity,
                                lineNumbers: false,
                                lineWrapping: true,
                                mode: this.calculateMode(this.state.model.type)
                            }}
                        />
                    </div>
                </div>
            </div>);

        return (<div className="NotebookEntry" onMouseEnter={this.focusOn} onMouseLeave={this.focusOff}>
            <div className="Closed">
                <GutterChevron
                    open={this.state.open}
                    pinned={this.state.model.pinned}
                    focus={this.state.focus}
                    onClick={this.attemptToggleChevron} />
                <GutterMenu this={this} />
                <EntryResults
                    result={this.state.html} />
            </div>
        </div>);
    }
}

const valueChanged = (type, text, cell) => {
    renderValue(type, text)
        .then(([name, deps, value]) => {
            cell.redefine(name, deps, value);
        })
        .catch(error => {
            cell.define([], Promise.reject(error));
        });
}

const renderValue = (type, text) => {
    switch (type) {
        case EntryType.HTML:
            return Promise.resolve([undefined, [], text]);

        case EntryType.MARKDOWN:
            return library.md().then(r => [undefined, [], r([text])]);

        case EntryType.JAVASCRIPT:
            try {
                const ast = parseCell(text);

                console.log("AST: ", ast);

                // if (ast.id !== null && ast.id.type === "ViewExpression") {
                //     const name = ast.id.id.name;

                //     const dependencies = [...new Set(ast.references.map((dep) => dep.name))];
                //     const body = text.slice(ast.body.start, ast.body.end);

                //     const fullBody = `(${dependencies.join(", ")}) => ${body}`;

                //     console.log("fullBody: ", fullBody);

                //     // eslint-disable-next-line
                //     const f = eval(fullBody);

                //     const result = (...args) => {
                //         console.log("arguments: ", args);
                //         const shadowValue = f.apply(null, args);

                //         return new ShadowValue(null /*Library.Generators.input(shadowValue)*/, shadowValue);
                //     }

                //     return Promise.resolve([name, dependencies, result]);
                // } else {
                const name = ast.id !== null && ast.id.type === "Identifier" ? ast.id.name : undefined;
                const dependencies = [...new Set(ast.references.map((dep) => dep.name))];
                const body = text.slice(ast.body.start, ast.body.end);

                const fullBody = `(${dependencies.join(", ")}) => ${body}`;

                // eslint-disable-next-line
                const result = eval(fullBody);

                return Promise.resolve([name, dependencies, result]);
                // }
            } catch (e) {
                return Promise.reject(e.message);
            }

        default:
            return Promise.reject(`to do: ${type}: ${text}`);
    }
}

const nextEntry = (id) => {
    return {
        id,
        type: EntryType.JAVASCRIPT,
        text: "1 + 2",
        pinned: true
    };
};

class Notebook extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            book: props.book,
            cells: new Map(),
            nextId: Math.max(...[0, ...props.book.map(entry => entry.id)])
        };

        this.insertBeforeEntry = this.insertBeforeEntry.bind(this);
        this.addAfterEntry = this.addAfterEntry.bind(this);
        this.moveEntryUp = this.moveEntryUp.bind(this);
        this.moveEntryDown = this.moveEntryDown.bind(this);
        this.deleteEntry = this.deleteEntry.bind(this);
    }

    cell(id) {
        if (this.state.cells.has(id))
            return this.state.cells.get(id)
        else {
            const cell = this.props.module.cell();
            this.state.cells.set(id, cell);
            return cell;
        }
    }

    insertBeforeEntry(id) {
        this.setState(state => ({ book: insertBefore(state.book, id) }));
    }

    addAfterEntry(id) {
        this.setState(state => ({ book: addAfter(state.book, id) }));
    }

    deleteEntry(id) {
        this.setState(state => {
            const entries = [...state.book];

            const cell = state.cells.get(id);
            if (cell !== undefined)
                cell.remove();

            return { book: entries.filter(entry => entry.id !== id) };
        });
    }

    moveEntryUp(id) {
        this.setState(state => {
            const entries = [...state.book];

            let idx = 0;
            while (true) {
                if (idx === entries.length) return {};

                if (id === entries[idx].id && idx > 0) {
                    const entry = entries.splice(idx, 1);
                    entries.splice(idx - 1, 0, entry[0]);
                    return { book: entries };
                }

                idx += 1;
            }
        });
    }

    moveEntryDown(id) {
        this.setState(state => {
            const entries = [...state.book];

            let idx = 0;
            while (true) {
                if (idx === entries.length) return {};

                if (id === entries[idx].id) {
                    const entry = entries.splice(idx, 1);
                    entries.splice(idx + 1, 0, entry[0]);
                    return { book: entries };
                }

                idx += 1;
            }
        });
    }

    render() {
        const notebookEntries = this.state.book.map((entry) =>
            <NotebookEntry
                key={entry.id}
                value={entry}
                cell={this.cell(entry.id)}
                insertBeforeEntry={this.insertBeforeEntry}
                addAfterEntry={this.addAfterEntry}
                moveEntryUp={this.moveEntryUp}
                moveEntryDown={this.moveEntryDown}
                deleteEntry={this.deleteEntry}
            />
        );

        return (
            <div className="Notebook">
                {notebookEntries}
            </div>
        );
    }
}

function* now() {
    while (true) {
        yield Date.now();
    }
}

function App() {
    const runtime = new Runtime();

    const builtins = runtime.newModule();

    builtins.cell("FileAttachment", CalculationPolicy.Dormant).define([], () => library.FileAttachment());
    builtins.cell("FileAttachments", CalculationPolicy.Dormant).define([], () => FileAttachments);
    builtins.cell("Arrow", CalculationPolicy.Dormant).define([], () => library.Arrow());
    builtins.cell("Inputs", CalculationPolicy.Dormant).define([], () => library.Inputs());
    builtins.cell("Mutable", CalculationPolicy.Dormant).define([], () => library.Mutable());
    builtins.cell("Plot", CalculationPolicy.Dormant).define([], () => library.Plot());
    builtins.cell("SQLite", CalculationPolicy.Dormant).define([], () => library.SQLite());
    builtins.cell("SQLiteDatabaseClient", CalculationPolicy.Dormant).define([], () => library.SQLiteDatabaseClient());
    builtins.cell("_", CalculationPolicy.Dormant).define([], () => library._());
    builtins.cell("aq", CalculationPolicy.Dormant).define([], () => library.aq());
    builtins.cell("d3", CalculationPolicy.Dormant).define([], () => library.d3());
    builtins.cell("dot", CalculationPolicy.Dormant).define([], () => library.dot());
    builtins.cell("htl", CalculationPolicy.Dormant).define([], () => library.htl());
    builtins.cell("html", CalculationPolicy.Dormant).define([], () => library.html());
    builtins.cell("md", CalculationPolicy.Dormant).define([], () => library.md());
    builtins.cell("require", CalculationPolicy.Dormant).define([], () => library.require());
    builtins.cell("resolve", CalculationPolicy.Dormant).define([], () => library.resolve());
    builtins.cell("svg", CalculationPolicy.Dormant).define([], () => library.svg());
    builtins.cell("tex", CalculationPolicy.Dormant).define([], () => library.tex());
    builtins.cell("topojson", CalculationPolicy.Dormant).define([], () => library.topojson());
    builtins.cell("vl", CalculationPolicy.Dormant).define([], () => library.vl());
    builtins.cell("DOM", CalculationPolicy.Dormant).define([], () => library.DOM);
    builtins.cell("Files", CalculationPolicy.Dormant).define([], () => library.Files);
    builtins.cell("Generators", CalculationPolicy.Dormant).define([], () => library.Generators);
    builtins.cell("now", CalculationPolicy.Dormant).define([], () => now());
    builtins.cell("Promises", CalculationPolicy.Dormant).define([], () => library.Promises);

    runtime.registerBuiltins(builtins);

    const module = runtime.newModule();

    window.module = module;

    return <Notebook module={module} book={notebook} />;
}

export default App;
