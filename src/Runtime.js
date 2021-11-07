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
        this.anonymousNameCounter = 0;
    }

    defineVariable(name, dependencies, value) {
        if (name === null || name === undefined) {
            this.anonymousNameCounter += 1;
            name = `__$${this.anonymousNameCounter}`;
        }

        const variable = this.bindings[name];

        if (variable === undefined) {
            const newVariable = new Variable(name, dependencies, value, this);
            this.bindings[name] = newVariable;

            newVariable.includeObserver(this);

            return newVariable;
        } else {
            variable.redefine(dependencies, value);
            return variable;
        }
    }

    variable(name) {
        return this.bindings[name];
    }

    fulfilled(name, value) {
        logger.info(`Fulfilled: ${name}: ${value}`);
        for (const variable of Object.values(this.bindings)) {
            if (variable.dependencies.includes(name))
                variable.fulfilled(name, value);
        }
    }

    pending(name) {
        logger.info(`Pending: ${name}`);
        for (const variable of Object.values(this.bindings)) {
            if (variable.dependencies.includes(name))
                variable.pending(name);
        }
    }

    rejected(name) {
        logger.info(`Error: ${name}`);
        for (const variable of Object.values(this.bindings)) {
            if (variable.dependencies.includes(name))
                variable.rejected(name);
        }
    }
}


class Variable {
    constructor(name, dependencies, value, module) {
        this.module = module;
        this.name = name;
        this.dependencies = dependencies;
        this.value = value;
        this.observers = [];
        this.sequence = 0;

        this.updateBindingsAndVerify();
    }

    redefine(dependencies, value) {
        this.dependencies = dependencies;
        this.value = value;

        this.updateBindingsAndVerify();
    }

    updateBindingsAndVerify() {
        this.bindings = {};
        for (const dependency of this.dependencies) {
            const variable = this.module.variable(dependency);
            if (variable !== undefined && variable.result.type === "DONE")
                this.bindings[dependency] = variable.result.value;
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