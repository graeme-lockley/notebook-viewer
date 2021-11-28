import React from "react"

export type EntryResultStatus =
    'OK' | 'ERROR';

export interface EntryResults {
    status: EntryResultStatus;
    text?: string;
    dom?: HTMLDivElement;
}

export interface EntryResultsProps {
    result: EntryResults;
}

export class EntryResults extends React.Component<EntryResultsProps> {
    elementRef: (element: HTMLDivElement | null, newThis: HTMLDivElement) => void;

    constructor(props: EntryResultsProps) {
        super(props);

        this.elementRef = (element: HTMLDivElement | null, dom: HTMLDivElement): void => {
            if (element !== null && dom !== undefined) {
                element.childNodes.forEach(child => element.removeChild(child));
                element.appendChild(dom);
            }
        };
    }

    render() {
        const result = this.props.result;
        const status = result.status;
        const dom = result.dom;

        if (dom !== undefined) {
            return (<div
                className={`NotebookBody-${status}`}
                ref={(e) => this.elementRef(e, dom)}
            />);
        }

        return (<div
            className={`NotebookBody-${status}`}
            dangerouslySetInnerHTML={{ __html: result.text ?? '' }}
        />);
    }
}
