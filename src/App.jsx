import React from "react"
import { BsBraces, BsCodeSlash, BsMarkdown, BsSlashCircle } from "react-icons/bs";
import "./App.css";
import { CodeMirror } from "./components/CodeMirror";
import { Gutter, GutterChevron, GutterEntryType, GutterPin } from "./components/NE-Gutter";
import { NotebookEntryType_HTML, NotebookEntryType_MARKDOWN, NotebookEntryType_JAVASCRIPT, NotebookEntryType_TEX } from "./components/NotebookEntryType";
import { Library } from "@observablehq/stdlib";
import { CalculationPolicy, Runtime } from "./Runtime";
import { parseCell } from "@observablehq/parser/src/parse.js"
import { stringify } from "flatted"

const library = new Library()

const notebook = [
    {
        id: 1,
        type: NotebookEntryType_MARKDOWN,
        text: "## Heading\n\n- Bullet 1,\n- Bullet 2, and\n- Bullet 3",
        pinned: false
    },
    {
        id: 2,
        type: NotebookEntryType_HTML,
        text: "Hello <strong>world</strong>",
        pinned: false
    },
    {
        id: 3,
        type: NotebookEntryType_JAVASCRIPT,
        text: "html`<p>We can drop in <em>reactive values</em> too like value (${value}), range (${range}) and when (${when}).</p>\n\n<p>We can also embed some reactive equations using value as the exponent ${tex`E = mc^{${value}}`}`",
        pinned: false
    },
    {
        id: 4,
        type: NotebookEntryType_JAVASCRIPT,
        text: "{\n  const inc = (n) => n + 1;\n  const values = [1, 2, 3, 4];\n\n  return values.map(inc);\n}",
        pinned: true
    },
    {
        id: 5,
        type: NotebookEntryType_JAVASCRIPT,
        text: "width = 10",
        pinned: true
    },
    {
        id: 6,
        type: NotebookEntryType_JAVASCRIPT,
        text: "range = width + 1",
        pinned: true
    },
    {
        id: 7,
        type: NotebookEntryType_JAVASCRIPT,
        text: '/*viewof*/ gain = Inputs.range([0, 11], {value: 2, step: 0.1, label: "Gain"})',
        pinned: true
    },
    {
        id: 8,
        type: NotebookEntryType_JAVASCRIPT,
        text: "value = Generators.input(gain)",
        pinned: true
    },
    {
        id: 9,
        type: NotebookEntryType_JAVASCRIPT,
        text: "when = now",
        pinned: true
    },
    {
        id: 10,
        type: NotebookEntryType_JAVASCRIPT,
        text: `{
    function formatDate(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
    }

    return formatDate(new Date(when));
}`,
        pinned: true
    },
];

// const notebook = [
//   {
//     id: 1,
//     type: NotebookEntryType_MARKDOWN,
//     text: "## Heading\n\n- Bullet 1,\n- Bullet 2, and\n- Bullet 3",
//     pinned: false
//   },
//   {
//     id: 2,
//     type: NotebookEntryType_HTML,
//     text: "Hello <strong>world</strong>",
//     pinned: false
//   },
//   {
//     id: 3,
//     type: NotebookEntryType_JAVASCRIPT,
//     text: "{\n  const xx = [1, 2, 3, 4];\n  return xx.map((x) => x + 1);\n}",
//     pinned: false
//   },
//   {
//     id: 4,
//     type: NotebookEntryType_JAVASCRIPT,
//     text: "width = 10",
//     pinned: true
//   },
//   {
//     id: 5,
//     type: NotebookEntryType_JAVASCRIPT,
//     text: "range = width + 1",
//     pinned: true
//   },
// ];

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
        console.log("cellObserver.fulfilled: ", cell);

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

class NotebookEntry extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            model: props.value,
            text: props.value.text,
            html: "",
            type: props.value.type,
            pinned: props.value.pinned,
            open: props.value.pinned,
            entryTypePopup: false,
            focus: false
        };

        this.attemptToggleChevron = this.attemptToggleChevron.bind(this);
        this.attemptTogglePin = this.attemptTogglePin.bind(this);
        this.attemptToggleEntryTypePopup = this.attemptToggleEntryTypePopup.bind(this);
        this.setEntryType = this.setEntryType.bind(this);
        this.focusOn = this.focusOn.bind(this);
        this.focusOff = this.focusOff.bind(this);
        this.changeText = this.changeText.bind(this);

        valueChanged(props.value.type, props.value.text, props.cell);
    }

    attemptToggleChevron() {
        this.setState(state => ({ open: state.pinned ? true : !state.open }));
    }

    attemptTogglePin() {
        this.setState(state => ({ pinned: !state.pinned }));
    }

    attemptToggleEntryTypePopup(e) {
        this.setState(state => ({ entryTypePopup: state.entryTypePopup === false ? true : false }));
    }

    setEntryType(et) {
        this.setState(state => ({ type: et, entryTypePopup: undefined }));
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
        this.setState(() => ({ focus: false, entryTypePopup: false }));
    }

    changeText(text) {
        this.setState((state) => {
            valueChanged(state.type, text, this.props.cell);
            return { text };
        });
        console.log("Module: ", this.props.cell.module);
    }

    changeEntryType(entryType) {
        this.setState((state) => {
            valueChanged(entryType, state.text, this.props.cell);
            return { type: entryType };
        });
    }

    calculateMode(type) {
        return type === NotebookEntryType_HTML ? "htmlmixed"
            : type === NotebookEntryType_JAVASCRIPT ? "javascript"
                : "markdown";
    }

    render() {
        if (this.state.open)
            return (<div className="NotebookEntry" onMouseEnter={this.focusOn} onMouseLeave={this.focusOff}>
                <div className="Upper">
                    <GutterChevron
                        open={this.state.open}
                        pinned={this.state.pinned}
                        focus={this.state.focus}
                        onClick={this.attemptToggleChevron} />
                    <Gutter
                        focus={this.state.focus} />
                    <EntryResults
                        result={this.state.html} />
                </div>
                <div className="Lower">
                    <GutterPin
                        pinned={this.state.pinned}
                        focus={this.state.focus}
                        onClick={this.attemptTogglePin} />
                    <GutterEntryType
                        type={this.state.type}
                        focus={this.state.focus}
                        onClick={this.attemptToggleEntryTypePopup}>
                        {this.state.entryTypePopup &&
                            <div className="NE-Popup">
                                <div className={this.state.type === NotebookEntryType_JAVASCRIPT ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.changeEntryType(NotebookEntryType_JAVASCRIPT)}><BsBraces size="0.7em" /> JavaScript</div>
                                <div className={this.state.type === NotebookEntryType_MARKDOWN ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.changeEntryType(NotebookEntryType_MARKDOWN)}><BsMarkdown size="0.7em" /> Markdown</div>
                                <div className={this.state.type === NotebookEntryType_HTML ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.changeEntryType(NotebookEntryType_HTML)}><BsCodeSlash size="0.7em" /> HTML</div>
                                <div className={this.state.type === NotebookEntryType_TEX ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.changeEntryType(NotebookEntryType_TEX)}><BsSlashCircle size="0.7em" /> TeX</div>
                            </div>
                        }
                    </GutterEntryType>
                    <div className="NotebookBody">
                        <CodeMirror
                            value={this.state.text}
                            onChange={this.changeText}
                            options={{
                                viewportMargin: Infinity,
                                lineNumbers: false,
                                lineWrapping: true,
                                mode: this.calculateMode(this.state.type)
                            }}
                        />
                    </div>
                </div>
            </div>);

        return (<div className="NotebookEntry" onMouseEnter={this.focusOn} onMouseLeave={this.focusOff}>
            <div className="Closed">
                <GutterChevron
                    open={this.state.open}
                    pinned={this.state.pinned}
                    focus={this.state.focus}
                    onClick={this.attemptToggleChevron} />
                <Gutter
                    focus={this.state.focus} />
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
        case NotebookEntryType_HTML:
            return Promise.resolve([undefined, [], text]);

        case NotebookEntryType_MARKDOWN:
            return library.md().then(r => [undefined, [], r([text])]);

        case NotebookEntryType_JAVASCRIPT:
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

function* now() {
    while (true) {
        yield Date.now();
    }
}

function App() {
    const runtime = new Runtime();

    const builtins = runtime.newModule();

    builtins.cell("FileAttachment", CalculationPolicy.Always).define([], () => library.FileAttachment());
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

    const notebookEntries = notebook.map((entry) =>
        <NotebookEntry key={entry.id} value={entry} cell={module.cell()} />
    );

    console.log(module);

    return (
        <div className="Notebook">
            {notebookEntries}
        </div>
    );
}

export default App;
