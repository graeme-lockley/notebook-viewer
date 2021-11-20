import { CalculationPolicy, Runtime } from "./Runtime";

test('construct a module', () => {
    const runtime = new Runtime();

    expect(runtime).toBeInstanceOf(Runtime);
});

test('constant cell updates value', () => {
    const runtime = new Runtime();

    const module = runtime.newModule();

    const a = module.cell("a")
    const b = module.cell("b")

    expect(objectSize(module.cells)).toEqual(2);
    expect(objectSize(module.bindings)).toEqual(2);

    a.define([], 10);
    b.define(["a"], (a) => a * 2);

    expect(module.find("a").result).toEqual({ type: "DONE", value: 10 });
    expect(module.find("b").result).toEqual({ type: "DONE", value: 20 });
});

test('constant cell updates value on change', async () => {
    const runtime = new Runtime();

    const module = runtime.newModule();

    const a = module.cell("a")
    const b = module.cell("b")

    a.define([], 10);
    b.define(["a"], (a) => a * 2);
    a.define([], 20);

    expect(module.find("a").result).toEqual({ type: "DONE", value: 20 });
    expect(module.find("b").result).toEqual({ type: "DONE", value: 40 });

    b.define(["a"], (a) => a * 3);
    expect(module.find("b").result).toEqual({ type: "DONE", value: 60 });

    a.define([], Promise.resolve(30));

    const v = await module.find("a").result.value;

    expect(v).toEqual(30);
    expect(module.find("b").result.type).toEqual("DONE");
    expect(module.find("b").result.value).toEqual(90);
});

test("duplicate bindings will place all dependent cells into error state", () => {
    const runtime = new Runtime();

    const module = runtime.newModule();

    const a1 = module.cell("a1")
    const a2 = module.cell("a2")
    const b = module.cell("b")
    const c = module.cell("c")
    const d = module.cell("d")

    a1.define([], 1);
    a2.define([], 2);

    b.define(["a"], (a) => a * 2);
    c.define([], 3);
    d.define(["b"], (b) => b * 3);

    expect(a1.result.value).toEqual(1);
    expect(a2.result.value).toEqual(2);
    expect(b.result.type).toEqual('ERROR');
    expect(c.result.value).toEqual(3);
    expect(d.result.type).toEqual('PENDING');

    a1.redefine("a", [], 4);

    expect(module.find("a1")).toBeUndefined();
    expect(module.find("a").result).toEqual({ type: "DONE", value: 4 });
    expect(a1.result.value).toEqual(4);
    expect(a2.result.value).toEqual(2);
    expect(b.result.value).toEqual(8);
    expect(c.result.value).toEqual(3);
    expect(d.result.value).toEqual(24);

    a2.redefine("a", [], 5);
    expect(module.find("a1")).toBeUndefined();
    expect(module.find("a2")).toBeUndefined();
    expect(module.find("a").result).toEqual({ type: "ERROR", value: 'Duplicate name' });
    expect(a1.result).toEqual({ type: "ERROR", value: 'Duplicate name' });
    expect(a2.result).toEqual({ type: "ERROR", value: 'Duplicate name' });
    expect(b.result.type).toEqual('PENDING');
    expect(c.result.value).toEqual(3);
    expect(d.result.type).toEqual('PENDING');

    a2.redefine("a2", [], 6);
    expect(module.find("a").result.value).toEqual(4);
    expect(a1.result.value).toEqual(4);
    expect(a2.result.value).toEqual(6);
    expect(b.result.value).toEqual(8);
    expect(c.result.value).toEqual(3);
    expect(d.result.value).toEqual(24);
});

test("cycle bindings will report error", () => {
    const runtime = new Runtime();

    const module = runtime.newModule();

    const a = module.cell("a")
    const b = module.cell("b")
    const c = module.cell("c")
    const d = module.cell("d")
    const e = module.cell("e")

    a.define([], 1);
    b.define(["a"], (a) => a + 1);
    c.define(["b"], (b) => b + 1);
    d.define(["c"], (c) => c + 1);
    e.define([], 10);

    expect(a.result.value).toEqual(1);
    expect(b.result.value).toEqual(2);
    expect(c.result.value).toEqual(3);
    expect(d.result.value).toEqual(4);
    expect(e.result.value).toEqual(10);

    a.define(["c"], (c) => c + 1);

    expect(a.result).toEqual({ type: "ERROR", value: 'Dependency cycle' });
    expect(b.result).toEqual({ type: "ERROR", value: 'Dependency cycle' });
    expect(c.result).toEqual({ type: "ERROR", value: 'Dependency cycle' });
    expect(d.result.type).toEqual('PENDING');
    expect(e.result.value).toEqual(10);
});

test("recursive cell will report error", () => {
    const runtime = new Runtime();
    const module = runtime.newModule();

    const a = module.cell('a');
    
    a.define(["a"], (a) => a + 1);
    expect(a.result).toEqual({ type: "ERROR", value: 'Dependency cycle' });
});

test("blind call's observers are called", () => {
    const runtime = new Runtime();
    const module = runtime.newModule();

    const a = module.cell('a');
    const c1 = module.cell();
    const c2 = module.cell();

    a.define([], 1);
    c1.define(["a"], (a) => a + 1);
    c2.define([], 99);

    expect(a.result.value).toEqual(1);
    expect(c1.result.type).toEqual('DONE');
    expect(c1.result.value).toEqual(2);
    expect(c2.result.type).toEqual('DONE');
    expect(c2.result.value).toEqual(99);
});

test("when a cell name changes all dependent values change", () => {
    const runtime = new Runtime();
    const module = runtime.newModule();

    const a = module.cell('a');
    const b = module.cell('b');

    a.define([], 1);
    b.define(["a"], (a) => a + 1);

    expect(a.result.value).toEqual(1);
    expect(b.result.value).toEqual(2);

    a.changeName("ap");
    expect(a.result.value).toEqual(1);
    expect(b.result.type).toEqual('ERROR');
});

test("when a cell is dependent on an unknown cell then place cell in error state", () => {
    const runtime = new Runtime();
    const module = runtime.newModule();

    const a = module.cell('a');

    a.define(["x"], (x) => x + 1);

    expect(a.result).toEqual({ type: "ERROR", value: 'Undefined name: x' });
});

test("when a cell is dormant then it is not calculated and does not react to updates", () => {
    const runtime = new Runtime();
    const module = runtime.newModule();

    const a = module.cell('a', CalculationPolicy.Dormant);
    const b = module.cell('b', CalculationPolicy.Dormant);
    const c = module.cell('c', CalculationPolicy.Dormant);

    a.define([], 1);
    b.define(["a"], (a) => a + 1);
    c.define(["a"], (a) => a + 1);

    expect(a.policy).toEqual(CalculationPolicy.Dormant);
    expect(a.result.type).toEqual('DORMANT');
    expect(b.result.type).toEqual('DORMANT');
    expect(c.result.type).toEqual('DORMANT');

    a.setPolicy(CalculationPolicy.Always);

    expect(a.result.type).toEqual('DONE');
    expect(a.result.value).toEqual(1);
    expect(b.result.type).toEqual('DORMANT');
    expect(c.result.type).toEqual('DORMANT');

    a.setPolicy(CalculationPolicy.Dormant);

    expect(a.result.type).toEqual('DORMANT');
    expect(b.result.type).toEqual('DORMANT');
    expect(c.result.type).toEqual('DORMANT');

    b.setPolicy(CalculationPolicy.Always);
    expect(a.policy).toEqual(CalculationPolicy.Dependent);
    expect(a.result.type).toEqual('DONE');
    expect(a.result.value).toEqual(1);
    expect(b.result.type).toEqual('DONE');
    expect(b.result.value).toEqual(2);
    expect(c.result.type).toEqual('DORMANT');
});

test("allow a runtime to have a module that captures builtins", () => {
    const runtime = new Runtime();
    const builtins = runtime.newModule();

    let whenInvocationCount = 0;

    const when = builtins.cell("when", CalculationPolicy.Dormant);
    when.define([], () => {
        whenInvocationCount += 1;
        return new Date().getTime();
    })

    expect(when.policy).toEqual(CalculationPolicy.Dormant);

    runtime.registerBuiltins(builtins);

    expect(whenInvocationCount).toEqual(0);

    const module = runtime.newModule();
    const a = module.cell("a");
    a.define(["when"], (when) => when);

    expect(whenInvocationCount).toEqual(1);
    expect(when.policy).toEqual(CalculationPolicy.Dependent);
    expect(a.policy).toEqual(CalculationPolicy.Always);
    expect(when.result.value).toEqual(a.result.value);
});


const objectSize = (obj) => {
    let size = 0;

    for (const key in obj) {
        if (obj.hasOwnProperty(key))
            size += 1;
    }

    return size;
};
