import { Runtime } from "../src/Runtime.ts";

const runtime = new Runtime();

const module = await runtime.newModule();

const a = module.createCell("a");
const b = module.createCell("b");
const c = module.createCell("c");

a.define([], 10);
b.define(["a"], (a) => a * 2);
a.define([], 20);

b.define(["a"], (a) => Promise.resolve(a * 3));

a.define([], 30);
b.define(["a", "c"], (a, c) => Promise.resolve(a * c));

c.define([], 0.5);
c.define([], 0.75);
c.define([], 0.25);

b.define(["c"], (c) => Promise.resolve(40 * c));
a.define([], 40);
