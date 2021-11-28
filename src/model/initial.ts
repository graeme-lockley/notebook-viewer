import { Book, EntryType } from "./notebook";

export const notebook: Book = [
    {
        id: 1,
        type: EntryType.MARKDOWN,
        text: "## Heading\n\n- Bullet 1,\n- Bullet 2, and\n- Bullet 3",
        pinned: false
    },
    {
        id: 2,
        type: EntryType.HTML,
        text: "Hello <strong>world</strong>",
        pinned: false
    },
    {
        id: 3,
        type: EntryType.JAVASCRIPT,
        text: "html`<p>We can drop in <em>reactive values</em> too like value (${value}), range (${range}) and when (${when}).</p>\n\n<p>We can also embed some reactive equations (thank you ${tex`\\TeX`}) using value as the exponent ${tex`E = mc^{${value}}`}`",
        pinned: false
    },
    {
        id: 4,
        type: EntryType.JAVASCRIPT,
        text: "{\n  const inc = (n) => n + 1;\n  const values = [1, 2, 3, 4];\n\n  return values.map(inc);\n}",
        pinned: true
    },
    {
        id: 5,
        type: EntryType.JAVASCRIPT,
        text: "width = 10",
        pinned: true
    },
    {
        id: 6,
        type: EntryType.JAVASCRIPT,
        text: "range = width + 1",
        pinned: true
    },
    {
        id: 7,
        type: EntryType.JAVASCRIPT,
        text: '/*viewof*/ gain = Inputs.range([0, 11], {value: 2, step: 0.1, label: "Gain"})',
        pinned: true
    },
    {
        id: 8,
        type: EntryType.JAVASCRIPT,
        text: "value = Generators.input(gain)",
        pinned: true
    },
    {
        id: 9,
        type: EntryType.JAVASCRIPT,
        text: "when = now",
        pinned: true
    },
    {
        id: 10,
        type: EntryType.JAVASCRIPT,
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
//     type: EntryType.MARKDOWN,
//     text: "## Heading\n\n- Bullet 1,\n- Bullet 2, and\n- Bullet 3",
//     pinned: false
//   },
//   {
//     id: 2,
//     type: EntryType.HTML,
//     text: "Hello <strong>world</strong>",
//     pinned: false
//   },
//   {
//     id: 3,
//     type: EntryType.JAVASCRIPT,
//     text: "{\n  const xx = [1, 2, 3, 4];\n  return xx.map((x) => x + 1);\n}",
//     pinned: false
//   },
//   {
//     id: 4,
//     type: EntryType.JAVASCRIPT,
//     text: "width = 10",
//     pinned: true
//   },
//   {
//     id: 5,
//     type: EntryType.JAVASCRIPT,
//     text: "range = width + 1",
//     pinned: true
//   },
// ];
