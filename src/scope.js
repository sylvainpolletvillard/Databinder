var ARRAY_MUTATOR_METHODS = ["pop", "push", "reverse", "shift", "sort", "splice", "unshift"];
var OBSERVATION = {
	SET: "SET",
	SPLICE: "SPLICE"
};

function Scope(data, parent) {
	if(data instanceof Scope){
		return data;
	}
	this.observers = {};
	this.data = this.makeObservable(wrapPrimitives(data || {}));
	this.parent = parent;
}

Scope.prototype = {

	//Getting a scope centered on value by name
	lookup: function(name, inner) {
		var key, names, i, l;
		var scope = this;
		var data = this.data;

		if(name === ".") return scope;

		if (name[0] === '/') {
			while(scope.parent){ scope = scope.parent; }
			data = scope.data;
			name = name.slice(1);
		} else if(name[0] === "."){
			i = 0;
			while(name[++i] === '.' && scope.parent){ scope = scope.parent; }
			data = scope.data;
			name = name.slice(i);
		} else {
			//Lookup to find a scope with a matching value
			key = name.split(".")[0];
			while(scope.parent){
				data = scope.data;
				if(isObject(data) && data.hasOwnProperty(key)){
					break;
				}
				scope = scope.parent;
			}
		}

		names = name.split('.');
		i = 0;
		l = names.length - 1;
		if(inner === true){
			l++;
		}

		//stops to penultimate name
		while (data !== undefined && i < l) {
			data = this.evalFunction(data[names[i++]]);
			scope = new Scope(data, scope);
		}

		return scope;
	},

	evalFunction: function(fn){
		var root;
		if(isFunction(fn)){
			root = this;
			while(root && root.parent){
				root = root.parent;
			}

			fn = fn.call(this.data, root.data, _currentBinding.element);
		}
		return fn;
	},

	resolve: function(declaration, noFunctionEval){
		var f, l, p, pl, params, resolvedParams, extension, extensionName;
		var extensions = declaration.split("|");
		var value = this.resolveParam(extensions.shift().trim());
		if(!noFunctionEval) {
			value = this.evalFunction(value);
		}
		if(extensions.length > 0){
			for (f = 0, l = extensions.length; f < l; f++) {
				params = extensions[f].trim().split(/\s+/);
				extensionName = params.shift();
				extension = databind.extensions[extensionName];
				if(extension !== undefined && isFunction(extension)){
					resolvedParams = [];
					for(p = 0, pl = params.length; p < pl; p++){
						resolvedParams.push(this.resolveParam(params[p]));
					}
					value = extension.apply(value, resolvedParams);
				} else {
					throw new DatabinderError("Unknown extension: " + extensionName);
				}
			}
		}
		return value;
	},

	resolveParam: function(param){
		var key, scope;
		if(!isNaN(param)){
			return +param; //inline Number
		}
		if(param[0] === '"' || param[0] === "'"){
			return param.slice(1, -1); //inline String
		}
		scope = this.lookup(param, false);
		if(param === "."){
			return scope.data;
		}
		key = param.match(/([^\/\.\s]+)\s*$/)[1];
		return scope.data[key];
	},

	makeObservable: function(obj, dataSignature) {
		var observable,
			scope = this,
			isArray = Array.isArray(obj);

		if(isArray){
			observable = obj.slice();
		} else if (isFunction(obj)){
			observable = function(){ return obj.apply(this, arguments); };
		} else if(Object.prototype.toString.call(obj) === "[object Object]"){
			observable = Object.create(Object.getPrototypeOf(obj), {});
		} else {
			return obj; // supposed not observable
		}

		if (isArray) {
			var signature = dataSignature || '.';
			ARRAY_MUTATOR_METHODS.forEach(function (method) {
				Object.defineProperty(observable, method, { configurable: true, value: function () {
					var start, nbToAdd, nbToRemove, returnValue;
					switch(method){
						case "pop": start = obj.length-1; nbToRemove=1; nbToAdd=0; break;
						case "push": start = obj.length; nbToRemove=0; nbToAdd=arguments.length; break;
						case "reverse": case "sort": start=0; nbToRemove=obj.length; nbToAdd=obj.length; break;
						case "shift": start=0; nbToRemove=1; nbToAdd=0; break;
						case "unshift": start=0; nbToRemove=0; nbToAdd=arguments.length; break;
						case "splice": start=arguments[0]; nbToRemove=arguments[1]; nbToAdd=arguments.length-2; break;
					}
					returnValue = obj[method].apply(obj, arguments);
					scope.makeObservable(obj, dataSignature);
					scope.callObservers(OBSERVATION.SPLICE, signature, start, nbToRemove, nbToAdd);
					return returnValue;
				}});
			});
		}

		//static ES5 proxy
		//TODO: use ES6 Proxy if available
		Object.getOwnPropertyNames(obj).forEach(function (key) {
			var signature = dataSignature ? dataSignature + "." + key : key;

			var propertyDescriptor = Object.getOwnPropertyDescriptor(obj, key);
			if(propertyDescriptor && propertyDescriptor.configurable){
				propertyDescriptor.get = function () {
					if (!(signature in scope.observers)) {
						scope.observers[signature] = [];
					}
					if(_currentBinding && scope.observers[signature].indexOf(_currentBinding) === -1){
						scope.observers[signature].push(_currentBinding);
					}
					if (obj[key] instanceof Object) {
						return scope.makeObservable(obj[key], signature);
					}
					return obj[key];
				};
				propertyDescriptor.set = function (val) {
					obj[key] = val;
					scope.callObservers(OBSERVATION.SET, signature, val);
					if (signature in scope.observers) {
						scope.observers[signature].forEach(function (binding) {
							binding.react(OBSERVATION.SET, signature, val);
						});
					}
				};
				delete propertyDescriptor.value;
				delete propertyDescriptor.writable;
				Object.defineProperty(observable, key, propertyDescriptor);
			}

		});

		return observable;
	},

	callObservers: function(observation, signature){

		/*var upperScope = scope;
		 while(upperScope){
		 if (signature in upperScope.observers) {
		 upperScope.observers[signature].forEach(function (binding) {
		 binding.react(OBSERVATION.SET, signature, val);
		 });
		 }
		 upperScope = upperScope.parent;
		 }*/

		if (signature in this.observers) {
			var o, ol, observers = this.observers[signature];
			for(o=0,ol=observers.length; o<ol; o++){
				observers[o].react.apply(observers[o], arguments);
			}
		}
	}
};