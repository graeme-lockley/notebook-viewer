import React from "react"
import { BsBraces, BsCodeSlash, BsMarkdown, BsSlashCircle } from "react-icons/bs";
import "./App.css";
import { CodeMirror } from "./components/CodeMirror";
import { Gutter, GutterChevron, GutterEntryType, GutterPin } from "./components/NE-Gutter";
import { NotebookEntryType_HTML, NotebookEntryType_MARKDOWN, NotebookEntryType_JAVASCRIPT, NotebookEntryType_TEX } from "./components/NotebookEntryType";
import { Library } from "@observablehq/stdlib";
import { Runtime } from "./Runtime";
import { parseCell } from "@observablehq/parser/src/parse.js"

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
    text: "{\n  const xx = [1, 2, 3, 4];\n  return xx.map((x) => x + 1);\n}",
    pinned: false
  },
  {
    id: 4,
    type: NotebookEntryType_JAVASCRIPT,
    text: "width = 10",
    pinned: true
  },
  {
    id: 5,
    type: NotebookEntryType_JAVASCRIPT,
    text: "range = width + 1",
    pinned: true
  },
];

class EntryResults extends React.Component {
  constructor(props) {
    super(props);

    this.elementRef = (element, newThis) => {
      if (element !== null && newThis.props.result.stuff !== undefined) {
        element.childNodes.forEach(child => {
          element.removeChild(child);
        });
        element.appendChild(newThis.props.result.stuff);
      }
    };
  }

  render() {
    if (this.props.result.stuff !== undefined) {
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
  fulfilled: (_, value) => {
    stuff.setState(() => {
      if (value instanceof Node)
        return { html: { status: 'OK', stuff: value } };
      else
        return { html: { status: 'OK', text: value } };
    });
  },

  pending: () => {
    stuff.setState(() => ({
      html: { status: 'OK', text: '' }
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

        const name = ast.id !== null && ast.id.type === "Identifier" ? ast.id.name : undefined;
        const dependencies = [...new Set(ast.references.map((dep) => dep.name))];
        const body = text.slice(ast.body.start, ast.body.end);

        const fullBody = `(${dependencies.join(", ")}) => ${body}`;
        
        // eslint-disable-next-line
        const result = eval(fullBody);

        return Promise.resolve([name, dependencies, result]);
      } catch (e) {
        return Promise.reject(e.message);
      }

    default:
      return Promise.reject(`to do: ${type}: ${text}`);
  }
}

function App() {
  const runtime = new Runtime();

  const module = runtime.newModule();

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
