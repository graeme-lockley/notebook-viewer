import { Runtime } from "./Runtime";

test('construct a module', () => {
    const runtime = new Runtime();

    expect(runtime).toBeInstanceOf(Runtime);
});

test('constant variable updates value', async () => {
    const runtime = new Runtime();

    const module = await runtime.newModule();

    module.defineVariable("a", [], 10);
    module.defineVariable("b", ["a"], (a) => a * 2);

    expect(module.variable("a").result).toEqual({ type: "DONE", value: 10 });
    expect(module.variable("b").result).toEqual({ type: "DONE", value: 20 });
});

test('constant variable updates value on change', async () => {
    const runtime = new Runtime();

    const module = await runtime.newModule();

    module.defineVariable("a", [], 10);
    module.defineVariable("b", ["a"], (a) => a * 2);
    module.defineVariable("a", [], 20);

    expect(module.variable("a").result).toEqual({ type: "DONE", value: 20 });
    expect(module.variable("b").result).toEqual({ type: "DONE", value: 40 });

    module.defineVariable("b", ["a"], (a) => a * 3);
    expect(module.variable("b").result).toEqual({ type: "DONE", value: 60 });


    module.defineVariable("a", [], Promise.resolve(30));

    const v = await module.variable("a").result.value;

    expect(v).toEqual(30);
    expect(module.variable("b").result.type).toEqual("DONE");
    expect(module.variable("b").result.value).toEqual(90);
});
