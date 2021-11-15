import winston from "winston";

const logger = winston.createLogger({
    level: 'info', //'info' | 'error',
    transports: [
        new winston.transports.Console(),
    ]
});

interface Observer {
    fulfilled(name: string, value: any): void;
    pending(name: string): void;
    rejected(name: string): void;
};

export class Runtime {
    newModule() {
        return Promise.resolve(new Module())
    }
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

    cell(name: string): Cell {
        const cellID = this.newCellID();
        const cell = new Cell(cellID, this);

        this.cells[cellID] = cell;
        cell.changeName(name);

        cell.includeObserver(this);

        return cell;
    }

    cellRenamed() {
        // verify that names are:
        //   - unique
        //   - no cycles

        const duplicates = new Set();

        this.bindings = {};
        for (const cell of Object.values(this.cells))
            if (cell.name !== undefined)
                if (this.bindings[cell.name] === undefined)
                    this.bindings[cell.name] = cell;
                else
                    duplicates.add(cell.name);

        for (const cell of Object.values(this.cells))
            if (cell.name !== undefined && duplicates.has(cell.name))
                cell.setStatus(CellStatus.DuplicateName, 'Duplicate name');
            else
                cell.setStatus(CellStatus.Okay);
    }

    find(id: number | string): Cell | undefined {
        return typeof id === "string"
            ? this.bindings[id]
            : this.cells[id];
    }

    fulfilled(name: string, value: any): void {
        logger.info(`Fulfilled: ${name}: ${value}`);

        for (const cell of Object.values(this.bindings)) {
            if (cell.dependencies.includes(name))
                cell.fulfilled(name, value);
        }
    }

    pending(name: string): void {
        logger.info(`Pending: ${name}`);

        for (const cell of Object.values(this.bindings)) {
            if (cell.dependencies.includes(name))
                cell.pending(name);
        }
    }

    rejected(name: string): void {
        logger.info(`Error: ${name}`);

        for (const cell of Object.values(this.bindings)) {
            if (cell.dependencies.includes(name))
                cell.rejected(name);
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

enum CellStatus {
    Okay,
    DuplicateName,
    DependencyCycle
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

        this.updateBindingsAndVerify();
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

    private updateBindingsAndVerify() {
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
        if (this.name !== undefined)
            if (this.result.type === ResultType.Done)
                observer.fulfilled(this.name, this.result.value);
            else if (this.result.type === ResultType.Pending)
                observer.pending(this.name);
            else
                observer.rejected(this.name);
    }

    fulfilled(name: string, value: any) {
        this.bindings[name] = value;
        this.verifyBindings();
    }

    pending(name: string) {
        delete this.bindings[name];
        this.verifyBindings();
    }

    rejected(name: string) {
        delete this.bindings[name];
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