import winston from "winston";

const logger = winston.createLogger({
    level: 'info', //'info' | 'error',
    transports: [
        new winston.transports.Console(),
    ]
});

export class Runtime {
    newModule() {
        return Promise.resolve(new Module())
    }
}

class Module {
    constructor() {
        this.bindings = {};
        this.cells = {};
        this.cellID = 0;
    }

    newCellID() {
        const cellID = this.cellID;
        this.cellID += 1;
        return cellID;
    }

    createCell(name) {
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
                cell.error('Duplicate name');
            else
                cell.noError();
    }

    cellOnID(id) {
        return this.cells[id];
    }

    cellOnName(name) {
        return this.bindings[name];
    }

    fulfilled(name, value) {
        logger.info(`Fulfilled: ${name}: ${value}`);
        for (const cell of Object.values(this.bindings)) {
            if (cell.dependencies.includes(name))
                cell.fulfilled(name, value);
        }
    }

    pending(name) {
        logger.info(`Pending: ${name}`);
        for (const cell of Object.values(this.bindings)) {
            if (cell.dependencies.includes(name))
                cell.pending(name);
        }
    }

    rejected(name) {
        logger.info(`Error: ${name}`);
        for (const cell of Object.values(this.bindings)) {
            if (cell.dependencies.includes(name))
                cell.rejected(name);
        }
    }
}


class Cell {
    constructor(id, module) {
        this.module = module;
        this.id = id;
        this.dependencies = [];
        this.value = undefined;
        this.observers = [];
        this.sequence = 0;
        this.inError = false;

        this.updateBindingsAndVerify();
    }

    redefine(name, dependencies, value) {
        this.changeName(name);
        this.define(dependencies, value)
    }

    changeName(name) {
        if (this.name !== name) {
            this.name = name;
            this.module.cellRenamed(this);
        }
    }

    define(dependencies, value) {
        this.dependencies = dependencies;
        this.value = value;

        this.updateBindingsAndVerify();
    }

    error(reason) {
        const wasInError = this.inError;

        this.inError = true;
        this.result = { type: 'ERROR', value: reason };

        if (!wasInError)
            this.notify();
    }

    noError() {
        if (this.inError) {
            this.inError = false;
            this.updateBindingsAndVerify();
        }
    }

    updateBindingsAndVerify() {
        this.bindings = {};
        for (const dependency of this.dependencies) {
            const cell = this.module.cellOnName(dependency);
            if (cell !== undefined && cell.result.type === "DONE")
                this.bindings[dependency] = cell.result.value;
        }

        this.verifyBindings();
    }

    includeObserver(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
            this.notifyObserver(observer);
        }
    }

    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1)
            this.observers.splice(index, 1);
    }

    verifyBindings() {
        if (!this.inError) {
            this.sequence += 1;
            const currentSequence = this.sequence;

            const updateResult = (type, value) => {
                this.result = { type, value };
                this.notify()
            };

            const verifyValue = (value) => {
                if (isPromise(value)) {
                    updateResult('PENDING', value);
                    value.then(actual => {
                        if (this.sequence === currentSequence)
                            updateResult('DONE', actual);
                        else
                            logger.info(`Dropping promise: ${this.name}: ${actual}`);
                    }).catch(err => {
                        if (this.sequence === currentSequence)
                            updateResult('ERROR', err);
                        else
                            logger.info(`Dropping error promise: ${this.name}: ${actual}`);
                    });
                } else
                    updateResult('DONE', value);
            };

            if (this.dependencies.length === 0)
                verifyValue(this.value);
            else if (this.dependencies.length === objectSize(this.bindings)) {
                try {
                    verifyValue(this.value.apply(null, this.dependencies.map(n => this.bindings[n])));
                } catch (e) {
                    updateResult('ERROR', e);
                }
            } else
                updateResult('PENDING', this.value);
        }
    }

    notify() {
        this.observers.forEach(observer => this.notifyObserver(observer));
    }

    notifyObserver(observer) {
        if (this.result.type === "DONE")
            observer.fulfilled(this.name, this.result.value);
        else if (this.result.type === "PENDING")
            observer.pending(this.name);
        else
            observer.rejected(this.name, this.result.value);
    }

    fulfilled(name, value) {
        this.bindings[name] = value;
        this.verifyBindings();
    }

    pending(name) {
        delete this.bindings[name];
        this.verifyBindings();
    }

    rejected(name) {
        delete this.bindings[name];
        this.verifyBindings();
    }
}

const objectSize = (obj) => {
    let size = 0;

    for (const key in obj) {
        if (obj.hasOwnProperty(key))
            size += 1;
    }

    return size;
};

const isPromise = (value) =>
    value && typeof value.then === "function";