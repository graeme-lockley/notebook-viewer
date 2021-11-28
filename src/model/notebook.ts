export enum EntryType {
    JAVASCRIPT,
    MARKDOWN,
    HTML,
    TEX
}

export type ItemID =
    number;

export interface Item {
    id: ItemID;
    type: EntryType;
    text: string;
    pinned: boolean;
}

export type Book =
    Array<Item>;

export const insertBefore = (book: Book, id: ItemID) => {
    const newEntry = nextEntry(book);

    let idx = 0;
    while (true) {
        if (idx === book.length) {
            book.push(newEntry);
            return;
        }

        if (id === book[idx].id) {
            book.splice(idx, 0, newEntry);
            return;
        }

        idx += 1;
    }
}

const nextID = (book: Book): ItemID => 
    Math.max(...[0, ...book.map(entry => entry.id)]) + 1;

const nextEntry = (book: Book) => {
    return {
        id: nextID(book),
        type: EntryType.JAVASCRIPT,
        text: "1 + 2",
        pinned: true
    };
};
