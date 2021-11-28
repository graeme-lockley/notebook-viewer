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

export const insertBefore = (book: Book, id: ItemID): Book => {
    const newBook = [...book];

    const newEntry = nextEntry(newBook);

    let idx = 0;
    while (true) {
        if (idx === newBook.length) {
            newBook.push(newEntry);
            return newBook;
        }

        if (id === newBook[idx].id) {
            newBook.splice(idx, 0, newEntry);
            return newBook;
        }

        idx += 1;
    }
}

export const addAfter = (book: Book, id: ItemID): Book => {
    const newBook = [...book];

    const newEntry = nextEntry(newBook);

    let idx = 0;
    while (true) {
        if (idx === newBook.length) {
            newBook.push(newEntry);
            return newBook;
        }

        if (id === newBook[idx].id) {
            newBook.splice(idx + 1, 0, newEntry);
            return newBook;
        }

        idx += 1;
    }
}

export const deleteEntry = (book: Book, id: ItemID): Book =>
    book.filter(entry => entry.id !== id)

export const moveEntryUp = (book: Book, id: ItemID): Book => {
    const newBook = [...book];

    let idx = 0;
    while (true) {
        if (idx === newBook.length)
            return newBook;

        if (id === newBook[idx].id && idx > 0) {
            const entry = newBook.splice(idx, 1);
            newBook.splice(idx - 1, 0, entry[0]);
            return newBook;
        }

        idx += 1;
    }
};

export const moveEntryDown = (book: Book, id: ItemID): Book => {
    const newBook = [...book];

    let idx = 0;
    while (true) {
        if (idx === newBook.length)
            return newBook;

        if (id === newBook[idx].id) {
            const entry = newBook.splice(idx, 1);
            newBook.splice(idx + 1, 0, entry[0]);
            return newBook;
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
