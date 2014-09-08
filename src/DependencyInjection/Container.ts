/// <reference path="../../typings/tsd.d.ts" />

interface IResolvableDefinition {
    constructor: Function;
    call?: (service: any, injector: Container) => void;
}

class Container {
    private resolved: {
        [name: string]: any
    } = {};

    private definitions: {
        [name: string]: IResolvableDefinition
    } = {};

    private aliased: {
        [name: string]: string
    } = {};

    clone(): Container {
        var container = new Container();

        for (var prop in this.definitions) {
            container.definitions[prop] = {
                constructor: this.definitions[prop].constructor,
                call: this.definitions[prop].call
            };
        }

        for (var prop in this.aliased) {
            container.aliased[prop] = this.aliased[prop];
        }

        for (var prop in this.resolved) {
            container.resolved[prop] = this.resolved[prop];
        }

        return container;
    }

    service(name:string, constructor:Function, call?: (service: any, injector: Container) => void): Container {
        this.throwIfAlreadyRegistered(name, 'service');

        this.definitions[name] = {
            constructor: constructor,
            call: call
        };

        return this;
    }

    factory(name: string, factory: (...any) => any): Container {
        this.throwIfAlreadyRegistered(name, 'factory');

        this.definitions[name] = {
            constructor: factory
        };

        return this;
    }

    constant(name:string, value:any): Container {
        this.throwIfAlreadyRegistered(name, 'constant');

        this.resolved[name] = value;

        return this;
    }

    alias(name:string, aliased:string): Container {
        this.throwIfAlreadyRegistered(name, 'alias');

        this.aliased[name] = aliased;

        return this;
    }

    inject(factory: Function, overrides:{ [name: string]: any } = {}): any {
        return this.resolve({ constructor: factory }, overrides);
    }

    get(name:string): any {
        // already existing
        if (this.resolved.hasOwnProperty(name)) {
            if (this.resolved[name] === 'RESOLVING') {
                throw new Error('Circular dependency detected when trying to resolve "' + name +'".');
            }
            return this.resolved[name];
        }

        // definition available
        if (this.definitions.hasOwnProperty(name)) {
            this.resolved[name] = 'RESOLVING';

            this.resolved[name] = this.resolve(this.definitions[name]);

            return this.resolved[name];
        }

        // alias available
        if (this.aliased.hasOwnProperty(name)) {
            this.resolved[name] = 'RESOLVING';

            this.resolved[name] = this.get(this.aliased[name]);

            return this.resolved[name];
        }

        throw new Error('Cannot resolve dependency named "' + name +'".');
    }

    private throwIfAlreadyRegistered(name: string, type: string): void {
        if (this.aliased.hasOwnProperty(name) || this.resolved.hasOwnProperty(name) || this.definitions.hasOwnProperty(name)) {
            throw new Error('Error registering ' + type + ', "' + name + '" already exists.')
        }
    }

    private extractArgumentNames(func: Function): string[] {
        try {
            // from annotation function of https://github.com/angular/angular.js/blob/master/src/auto/injector.js
            return func.toString()
                .replace(new RegExp('((\\/\\/.*$)|(\\/\\*[\\s\\S]*?\\*\\/))', 'mg'), '')
                .match(new RegExp('^function\\s*[^\\(]*\\(\\s*([^\\)]*)\\)', 'm'))[1]
                .split(',')
                .map(argument => argument.trim())
                .filter(argument => argument !== '');
        } catch(err) {
            throw new Error('Fail to resolve dependencies of malformed function "' + func.toString() + '".');
        }
    }

    private instantiate(func: Function, args: any[]): any {
        // create an instance in case we have a type constructor
        var genericConstructor = () => {};
        genericConstructor.prototype = func.prototype;
        var instance = new genericConstructor();

        // run the constructor
        var result = func.apply(instance, args);

        // if the constructor did not return, whe we using a type constructor
        if (typeof result === 'undefined') {
            result = instance;
        }

        return result;
    }

    private resolve(definition: IResolvableDefinition, overrides: { [name: string]: any } = {}): any {
        var args = this.extractArgumentNames(definition.constructor);

        args = args.map(argument => {
            if (overrides.hasOwnProperty(argument)) {
                return overrides[argument];
            }

            return this.get(argument);
        });

        var result = this.instantiate(definition.constructor, args);

        // call the post instantiation hook
        if (definition.call) {
            definition.call.call(undefined, result, this);
        }

        return result;
    }
}

export = Container;

