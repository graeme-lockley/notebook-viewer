import { Runtime } from "../src/Runtime.js";

const runtime = new Runtime();

const module = await runtime.newModule();

module.defineVariable("a", [], 10);
module.defineVariable("b", ["a"], (a) => a * 2);
module.defineVariable("a", [], 20);

module.defineVariable("b", ["a"], (a) => Promise.resolve(a * 3));

module.defineVariable("a", [], 30);
module.defineVariable("b", ["a", "c"], (a, c) => Promise.resolve(a * c));

module.defineVariable("c", [], 0.5);
module.defineVariable("c", [], 0.75);
module.defineVariable("c", [], 0.25);

module.defineVariable("b", ["c"], (c) => Promise.resolve(40 * c));
module.defineVariable("a", [], 40);
