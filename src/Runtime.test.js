import { Runtime } from "./Runtime";

test('construct a module', () => {
    const runtime = new Runtime();

    expect(runtime).toBeInstanceOf(Runtime);
});

test('constant variable updates value', async () => {
    const runtime = new Runtime();

    const module = await runtime.newModule();

    const a = module.createCell("a")
    const b = module.createCell("b")

    expect(objectSize(module.cells)).toEqual(2);
    expect(objectSize(module.bindings)).toEqual(2);

    a.define([], 10);
    b.define(["a"], (a) => a * 2);

    expect(module.cellOnName("a").result).toEqual({ type: "DONE", value: 10 });
    expect(module.cellOnName("b").result).toEqual({ type: "DONE", value: 20 });
});

test('constant variable updates value on change', async () => {
    const runtime = new Runtime();

    const module = await runtime.newModule();

    const a = module.createCell("a")
    const b = module.createCell("b")

    a.define([], 10);
    b.define(["a"], (a) => a * 2);
    a.define([], 20);

    expect(module.cellOnName("a").result).toEqual({ type: "DONE", value: 20 });
    expect(module.cellOnName("b").result).toEqual({ type: "DONE", value: 40 });

    b.define(["a"], (a) => a * 3);
    expect(module.cellOnName("b").result).toEqual({ type: "DONE", value: 60 });

    a.define([], Promise.resolve(30));

    const v = await module.cellOnName("a").result.value;

    expect(v).toEqual(30);
    expect(module.cellOnName("b").result.type).toEqual("DONE");
    expect(module.cellOnName("b").result.value).toEqual(90);
});

test("duplicate bindings will place all dependent values into error state", async () => {
    const runtime = new Runtime();

    const module = await runtime.newModule();

    const a1 = module.createCell("a1")
    const a2 = module.createCell("a2")
    const b = module.createCell("b")
    const c = module.createCell("c")

    a1.define([], 1);
    a2.define([], 2);

    b.define(["a"], (a) => a * 2);
    c.define([], 3);

    expect(a1.result.value).toEqual(1);
    expect(a2.result.value).toEqual(2);
    expect(b.result.type).toEqual("PENDING");
    expect(c.result.value).toEqual(3);

    a1.redefine("a", [], 4);

    expect(module.cellOnName("a1")).toBeUndefined();
    expect(module.cellOnName("a").result).toEqual({ type: "DONE", value: 4 });
    expect(a1.result.value).toEqual(4);
    expect(a2.result.value).toEqual(2);
    expect(b.result.value).toEqual(8);
    expect(c.result.value).toEqual(3);

    a2.redefine("a", [], 5);
    expect(module.cellOnName("a1")).toBeUndefined();
    expect(module.cellOnName("a2")).toBeUndefined();
    expect(module.cellOnName("a").result).toEqual({ type: "ERROR", value: 'Duplicate name' });
    expect(a1.result).toEqual({ type: "ERROR", value: 'Duplicate name' });
    expect(a2.result).toEqual({ type: "ERROR", value: 'Duplicate name' });
    expect(b.result.type).toEqual('PENDING');
    expect(c.result.value).toEqual(3);

    a2.redefine("a2", [], 6);
    expect(module.cellOnName("a").result.value).toEqual(4);
    expect(a1.result.value).toEqual(4);
    expect(a2.result.value).toEqual(6);
    expect(b.result.value).toEqual(8);
    expect(c.result.value).toEqual(3);
});

const objectSize = (obj) => {
    let size = 0;

    for (const key in obj) {
        if (obj.hasOwnProperty(key))
            size += 1;
    }

    return size;
};