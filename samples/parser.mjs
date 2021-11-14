import { parseCell } from "@observablehq/parser/src/parse.js"

const dumpAST = (content) => {
    const ast = parseCell(content);

    console.log("--------------");
    console.log(content);
    console.log("---");
    console.log(ast);
};

dumpAST("foo * bar");
dumpAST("md`hello ${foo + bar}`");
dumpAST("hello = foo * bar;");
dumpAST("hello = {\n  function add(a, b) { return a + b; }\n\n  add(10, width);\n}");
dumpAST("import { name, surname} from 'something/or/other';");

console.log("--------------");
