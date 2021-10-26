import React from "react"
import './App.css';

const NotebookEntryType_JAVASCRIPT = 0;
// const NotebookEntryType_MARKDOWN = 1;
const NotebookEntryType_HTML = 2;
// const NotebookEntryType_TEX = 3;

const notebook = [
  {
    id: 1,
    type: NotebookEntryType_HTML,
    text: "Hello world",
    pinned: false,
  },
  {
    id: 2,
    type: NotebookEntryType_JAVASCRIPT,
    text: "1 + 2",
    pinned: true
  }
];

class NotebookEntry extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: props.value.id,
      type: props.value.type,
      text: props.value.text,
      pinned: props.value.pinned
    };
  }

  render() {
    return <div className="NotebookEntry">{this.state.id}: {this.state.text} ({this.state.type})</div>
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
