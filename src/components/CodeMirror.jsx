import React from "react"

import className from 'classnames';

import "codemirror/lib/codemirror.js";
import "codemirror/lib/codemirror.css";

import "./CodeMirror.css";

require("codemirror/mode/htmlmixed/htmlmixed.js")
require("codemirror/mode/javascript/javascript.js")
require("codemirror/mode/markdown/markdown.js")

export class CodeMirror extends React.Component {
  constructor(props) {
    super(props);

    this.state = { isFocused: false }
    this.codeMirrorValueChanged = this.codeMirrorValueChanged.bind(this);
    this.cursorActivity = this.cursorActivity.bind(this);
    this.scrollChanged = this.scrollChanged.bind(this);
    this.focusChanged = this.focusChanged.bind(this);
  }

  getCodeMirrorInstance() {
    return this.props.codeMirrorInstance || require('codemirror');
  }

  componentDidMount() {
    const codeMirrorInstance = this.getCodeMirrorInstance();
    this.codeMirror = codeMirrorInstance.fromTextArea(this.textareaNode, this.props.options);
    this.codeMirror.on('change', this.codeMirrorValueChanged);
    this.codeMirror.on('cursorActivity', this.cursorActivity);
    this.codeMirror.on('focus', this.focusChanged.bind(this, true));
    this.codeMirror.on('blur', this.focusChanged.bind(this, false));
    this.codeMirror.on('scroll', this.scrollChanged);
    this.codeMirror.setValue(this.props.defaultValue || this.props.value || '');
  }

  componentWillUnmount() {
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
    }
  }

  focus() {
    if (this.codeMirror) {
      this.codeMirror.focus();
    }
  }

  focusChanged(focused) {
    this.setState({
      isFocused: focused,
    });
    this.props.onFocusChange && this.props.onFocusChange(focused);
  }

  cursorActivity(cm) {
    this.props.onCursorActivity && this.props.onCursorActivity(cm);
  }

  scrollChanged(cm) {
    this.props.onScroll && this.props.onScroll(cm.getScrollInfo());
  }

  codeMirrorValueChanged(doc, change) {
    if (this.props.onChange && change.origin !== 'setValue') {
      this.props.onChange(doc.getValue(), change);
    }
  }

  render() {
    const editorClassName = className(
      'ReactCodeMirror',
      this.state.isFocused ? 'ReactCodeMirror--focused' : null,
      this.props.className
    );

    // console.log("editorClassName: ", editorClassName);

    return (
      <div className={editorClassName}>
        <textarea
          ref={ref => this.textareaNode = ref}
          name={this.props.name || this.props.path}
          defaultValue={this.props.value}
          autoComplete="off"
          autoFocus={this.props.autoFocus}
          className="MyCodeMirror"
        />
      </div>
    );
  }
}
