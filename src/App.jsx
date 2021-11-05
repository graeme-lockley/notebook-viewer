import React from "react"
import { BsBraces, BsCodeSlash, BsMarkdown, BsSlashCircle } from "react-icons/bs";
import "./App.css";
import { CodeMirror } from "./components/CodeMirror";
import { Gutter, GutterChevron, GutterEntryType, GutterPin } from "./components/NE-Gutter";
import { NotebookEntryType_HTML, NotebookEntryType_MARKDOWN, NotebookEntryType_JAVASCRIPT, NotebookEntryType_TEX } from "./components/NotebookEntryType";

const notebook = [
  {
    id: 1,
    type: NotebookEntryType_HTML,
    text: "Hello <strong>world</strong>",
    pinned: false
  },
  {
    id: 2,
    type: NotebookEntryType_JAVASCRIPT,
    text: "{ const xx = [1, 2, 3, 4];\n  xx.map((x) => x + 1); }",
    pinned: true
  }
];

function EntryResults(props) {
  return (<div
    className={`NotebookBody-${props.result.status}`}
    dangerouslySetInnerHTML={{ __html: props.result.text }}
  />);
}

class NotebookEntry extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      model: props.value,
      text: props.value.text,
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

  toHTML() {
    const type = this.state.type;

    try {
      // eslint-disable-next-line
      const text = (type === NotebookEntryType_HTML) ? this.state.text : eval(this.state.text);
      return { status: 'OK', text };
    } catch (e) {
      return { status: 'ERROR', text: e.message };
    }
  }

  focusOn() {
    this.setState(state => ({ focus: true }));
  }

  focusOff() {
    this.setState(state => ({ focus: false, entryTypePopup: false }));
  }

  changeText(text, change) {
    this.setState(state => ({ text }));
  }

  render() {
    const html = this.toHTML();

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
            result={html} />
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
                <div className={this.state.type === NotebookEntryType_JAVASCRIPT ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.setEntryType(NotebookEntryType_JAVASCRIPT)}><BsBraces size="0.7em" /> JavaScript</div>
                <div className={this.state.type === NotebookEntryType_MARKDOWN ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.setEntryType(NotebookEntryType_MARKDOWN)}><BsMarkdown size="0.7em"/> Markdown</div>
                <div className={this.state.type === NotebookEntryType_HTML ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.setEntryType(NotebookEntryType_HTML)}><BsCodeSlash size="0.7em" /> HTML</div>
                <div className={this.state.type === NotebookEntryType_TEX ? "NE-PopupEntry-default" : "NE-PopupEntry"} onClick={() => this.setEntryType(NotebookEntryType_TEX)}><BsSlashCircle size="0.7em"/> TeX</div>
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
                mode: this.state.type === NotebookEntryType_HTML ? "htmlmixed" : "javascript"
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
          result={html} />
      </div>
    </div>);
  }
}

function App() {
  const notebookEntries = notebook.map((entry) =>
    <NotebookEntry key={entry.id} value={entry} />
  );

  return (
    <div className="Notebook">
      {notebookEntries}
    </div>
  );
}

export default App;
