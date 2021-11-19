import winston from "winston";

const logger = winston.createLogger({
    level: 'info', //'info' | 'error',
    transports: [
        new winston.transports.Console(),
    ]
});

export interface Observer {
    fulfilled(cell: Cell, value: any): void;
    pending(cell: Cell): void;
    rejected(cell: Cell, value?: any): void;
};

export class Runtime {
    newModule() {
        return new Module()
    }
}

enum CellStatus {
    Okay,
    DuplicateName,
    DependencyCycle
}

class Module implements Observer {
    bindings: { [key: string]: Cell };
    cells: { [key: number]: Cell };
    cellID: number;

    constructor() {
        this.bindings = {};
        this.cells = {};
        this.cellID = 0;
    }

    private newCellID(): number {
        const cellID = this.cellID;
        this.cellID += 1;
        return cellID;
    }

    cell(name?: string | undefined): Cell {
        const cellID = this.newCellID();
        const cell = new Cell(cellID, this);

        this.cells[cellID] = cell;
        if (name !== undefined)
            cell.changeName(name);

        cell.includeObserver(this);

        return cell;
    }

    removeCell(cell: Cell): void {
        delete this.cells[cell.id];
        this.cellRenamed();
    }

    cellRenamed() {
        // verify that names are:
        //   - unique
        //   - no cycles

        const duplicates = new Set<string>();
        const dependencies = new Map<string, Set<string>>();

        this.bindings = {};

        for (const cell of Object.values(this.cells))
            if (cell.name !== undefined)
                if (this.bindings[cell.name] === undefined) {
                    this.bindings[cell.name] = cell;
                    dependencies.set(cell.name, new Set(cell.dependencies));
                }
                else
                    duplicates.add(cell.name);

        let anyChanges = true;
        while (anyChanges) {
            anyChanges = false;

            dependencies.forEach((value, key) => {
                let result = value;

                value.forEach((e) => {
                    const newDependencies = dependencies.get(e);

                    if (newDependencies !== undefined) 
                        result = union(result, newDependencies);
                })

                if (result.size !== value.size) {
                    anyChanges = true;
                    dependencies.set(key, result);
                }
            });
        }

        // logger.info("Dependencies:");
        // for (const [key, value] of dependencies.entries()) {
        //     logger.info(`  ${key}: ${[...value]}`);
        // }        

        for (const cell of Object.values(this.cells)) {
            const name = cell.name;

            if (name === undefined) 
                cell.setStatus(CellStatus.Okay);
            else if (duplicates.has(name))
                cell.setStatus(CellStatus.DuplicateName, 'Duplicate name');
            else 
            {
                const deps = dependencies.get(name);

                if (deps !== undefined && deps.has(name))
                    cell.setStatus(CellStatus.DependencyCycle, 'Dependency cycle');
                else
                    cell.setStatus(CellStatus.Okay);
            }
        }

        for (const cell of Object.values(this.cells)) {
            cell.updateBindingsAndVerify();
        }
    }

    find(id: number | string): Cell | undefined {
        return typeof id === "string"
            ? this.bindings[id]
            : this.cells[id];
    }

    fulfilled(cell: Cell, value: any): void {
        const name = cell.name;

        logger.info(`Fulfilled: ${name} (${cell.id}): ${value}`);

        if (name !== undefined)
            for (const dependentCell of Object.values(this.bindings)) {
                if (dependentCell.dependencies.includes(name))
                dependentCell.fulfilled(cell, value);
            }
    }

    pending(cell: Cell): void {
        const name = cell.name;

        logger.info(`Pending: ${name} (${cell.id})`);

        if (name !== undefined)
            for (const dependentCell of Object.values(this.bindings)) {
                if (dependentCell.dependencies.includes(name))
                    dependentCell.pending(cell);
            }
    }

    rejected(cell: Cell, value?: any): void {
        const name = cell.name;

        logger.info(`Error: ${name} (${cell.id}): ${value}`);

        if (name !== undefined)
            for (const dependentCell of Object.values(this.bindings)) {
                if (dependentCell.dependencies.includes(name))
                    dependentCell.rejected(cell, value);
            }
    }
}

enum ResultType {
    Error = 'ERROR',
    Pending = 'PENDING',
    Done = 'DONE'
}

interface Result {
    type: ResultType;
    value: any;
}

class Cell {
    id: number;
    name: string | undefined;
    module: Module;
    dependencies: Array<string>;
    value: any;
    observers: Array<Observer>;
    bindings: { [key: string]: Cell };
    sequence: number;
    status: CellStatus;
    result: Result;

    constructor(id: number, module: Module) {
        this.module = module;
        this.id = id;
        this.dependencies = [];
        this.value = undefined;
        this.observers = [];
        this.bindings = {};
        this.sequence = 0;
        this.status = CellStatus.Okay;
        this.result = { type: ResultType.Pending, value: undefined };

        this.updateBindingsAndVerify();
    }

    redefine(name: string, dependencies: Array<string>, value: any): void {
        this.dependencies = dependencies;
        this.value = value;

        if (this.name !== name) {
            this.name = name;
            this.module.cellRenamed();
        }

        this.updateBindingsAndVerify();
    }

    changeName(name: string): void {
        if (this.name !== name) {
            this.name = name;
            this.module.cellRenamed();
        }
    }

    define(dependencies: Array<string>, value: any): void {
        this.dependencies = dependencies;
        this.value = value;
        this.module.cellRenamed();
    }

    remove(): void {
        this.module.removeCell(this);
        this.dependencies = [];
        this.value = undefined;
        this.observers = [];
        this.bindings = {};
    }

    setStatus(status: CellStatus, reason?: string | undefined): void {
        const oldStatus = this.status;

        this.status = status;
        if (status !== CellStatus.Okay)
            this.result = { type: ResultType.Error, value: reason };

        if (status === CellStatus.Okay && oldStatus !== CellStatus.Okay)
            this.updateBindingsAndVerify();
        else if (status !== CellStatus.Okay && oldStatus === CellStatus.Okay)
            this.notify();
    }

    updateBindingsAndVerify() {
        this.bindings = {};
        for (const dependency of this.dependencies) {
            const cell = this.module.find(dependency);
            if (cell !== undefined && cell.result.type === ResultType.Done)
                this.bindings[dependency] = cell.result.value;
        }

        this.verifyBindings();
    }

    includeObserver(observer: Observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
            this.notifyObserver(observer);
        }
    }

    removeObserver(observer: Observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1)
            this.observers.splice(index, 1);
    }

    private verifyBindings() {
        if (this.status === CellStatus.Okay) {
            this.sequence += 1;
            const currentSequence = this.sequence;

            const updateResult = (type: ResultType, value: any) => {
                this.result = { type, value };
                this.notify()
            };

            const verifyValue = (value: any) => {
                if (isPromise(value)) {
                    updateResult(ResultType.Pending, value);
                    value.then((actual: any) => {
                        if (this.sequence === currentSequence)
                            updateResult(ResultType.Done, actual);
                        else
                            logger.info(`Dropping promise: ${this.name}: ${actual}`);
                    }).catch((err: any) => {
                        if (this.sequence === currentSequence)
                            updateResult(ResultType.Error, err);
                        else
                            logger.info(`Dropping error promise: ${this.name}: ${err}`);
                    });
                } else
                    updateResult(ResultType.Done, value);
            };

            if (this.dependencies.length === 0)
                verifyValue(this.value);
            else if (this.dependencies.length === objectSize(this.bindings)) {
                try {
                    verifyValue(this.value.apply(null, this.dependencies.map(n => this.bindings[n])));
                } catch (e) {
                    updateResult(ResultType.Error, e);
                }
            } else
                updateResult(ResultType.Pending, this.value);
        }
    }

    private notify() {
        this.observers.forEach(observer => this.notifyObserver(observer));
    }

    private notifyObserver(observer: Observer) {
        try {
            if (this.result.type === ResultType.Done)
                observer.fulfilled(this, this.result.value);
            else if (this.result.type === ResultType.Pending)
                observer.pending(this);
            else
                observer.rejected(this, this.result.value);
        } catch(e) {
            logger.error(`notifyObserver: Error: ${this.name}: ${observer}: ${e}`);
        }
    }

    fulfilled(cell: Cell, value: any) {
        this.bindings[cell.name!] = value;
        this.verifyBindings();
    }

    pending(cell: Cell) {
        delete this.bindings[cell.name!];
        this.verifyBindings();
    }

    rejected(cell: Cell, value?: any) {
        delete this.bindings[cell.name!];
        this.verifyBindings();
    }
}

const objectSize = (obj: any) => {
    let size = 0;

    for (const key in obj) {
        if (obj.hasOwnProperty(key))
            size += 1;
    }

    return size;
};

const isPromise = (value: any) =>
    value && typeof value.then === "function";

const union = <A>(setA : Set<A>, setB : Set<A>): Set<A> => {
    const _union = new Set<A>(setA)

    setB.forEach((elem) => {
        _union.add(elem);
    })

    return _union
}