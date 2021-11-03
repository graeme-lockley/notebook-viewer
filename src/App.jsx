import React from "react"
import "./App.css";
import { CodeMirror } from "./components/CodeMirror";
import { Gutter, GutterChevron, GutterEntryType, GutterPin } from "./components/NE-Gutter";
import { NotebookEntryType_HTML, NotebookEntryType_JAVASCRIPT } from "./components/NotebookEntryType";

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
      pinned: props.value.pinned,
      open: props.value.pinned,
      focus: false
    };

    this.attemptToggleChevron = this.attemptToggleChevron.bind(this);
    this.attemptTogglePin = this.attemptTogglePin.bind(this);
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

  toHTML() {
    const type = this.state.model.type;

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
    this.setState(state => ({ focus: false }));
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
            type={this.state.model.type}
            focus={this.state.focus} />
          <div className="NotebookBody">
            <CodeMirror
              value={this.state.text}
              onChange={this.changeText}
              options={{
                viewportMargin: Infinity,
                lineNumbers: false,
                lineWrapping: true,
                mode: this.state.model.type === NotebookEntryType_HTML ? "htmlmixed" : "javascript"
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
