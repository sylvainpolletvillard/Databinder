/*
 Databinder
 @version 0.8
 @author Sylvain Pollet-Villard
 @license MIT
 @website http://syllab.fr/projets/web/databinder/
 */

;(function(global) {

	//configurables
	var BINDING_ATTRIBUTE = "data-bind";
	var BINDING_GLOBAL = "databind";

	//inner constants & enumerations
	var BINDINGS_REGEX = /(?:^|,)\s*(?:(\w+):)?\s*([\w\.\/\|\'\"\s-]+|{.+})+/g;
	var ARRAY_MUTATOR_METHODS = ["pop", "push", "reverse", "shift", "sort", "splice", "unshift"];
	var OBSERVATION = {
		SET: "SET",
		SPLICE: "SPLICE"
	};

	//private
	var _currentBinding;

	function isFunction(obj) {
		return typeof obj === "function";
	}

	function isObject(obj) {
		return typeof obj === "object";
	}

	function wrapPrimitives(obj){
		switch(typeof obj){
			/*jshint -W053 */
			case "string": return new String(obj);
			case "number": return new Number(obj);
			case "boolean": return new Boolean(obj);
			default: return obj;
		}
	}

	function DatabinderError(message) {
		this.name = 'DatabinderError';
		this.message = "[Databinder] " + message;
	}

	DatabinderError.prototype = new Error();
	DatabinderError.prototype.constructor = DatabinderError;

	/* classList shim for IE9 */
	var classListSupported = ("classList" in document.createElement("p"));

	function toggleClass(element, className, bool) {
		if (!classListSupported) {
			var classes = element.className.split(" "),
				i = classes.indexOf(className);
			if (bool && i === -1) {
				classes.push(className);
			} else if (!bool && i >= 0) {
				classes.splice(i, 1);
			}
			element.className = classes.join(" ").trim();
		} else {
			element.classList[bool ? "add" : "remove"](className);
		}
	}

	function DataBinding(element) {
		this.bindings = {};
		this.eventListeners = {};
		this.originalInnerHTML = element.innerHTML;
		this.element = element;
		element.databinding = this;
	}

	DataBinding.prototype = {

		set: function(data){
			this.scope = new Scope(data, null, this);
			this.innerScope = this.scope; //inherit scope by default
			this.data = this.scope.data;
			this.bindings = this.getBindings();
			return this.reset();
		},

		reset: function(){
			if(this.originalInnerHTML !== undefined){
				this.element.innerHTML = this.originalInnerHTML;
			}
			this.applyBindings();
			return this;
		},

		get: function(){
			if((this.element instanceof HTMLInputElement	|| this.element instanceof HTMLTextAreaElement)	&& "value" in this.bindings){
				this.scope.lookup(this.bindings.value).data[this.bindings.value] = this.element.value;
			}

			if(this.element.children) {
				for(var c=0, l=this.element.children.length; c<l; c++){
					var child = this.element.children[c];
					if(child.databinding instanceof DataBinding){
						child.databinding.get();
					}
				}
			}
			return this;
		},

		getBindings: function(){
			var bindings = {}, value, attribute, bindingAttr;
			if(this.element.hasAttribute(BINDING_ATTRIBUTE)){
				bindingAttr = this.element.getAttribute(BINDING_ATTRIBUTE);
				if(bindingAttr) {
					var match = BINDINGS_REGEX.exec(bindingAttr);
					if (match === null) {
						throw new DatabinderError("Invalid argument for data-binding: " + bindingAttr);
					}
					while (match !== null) {
						value = match[2];
						attribute = match[1] || this.guessAttribute(value);
						bindings[attribute] = new Binding(this.element, attribute, value);
						match = BINDINGS_REGEX.exec(bindingAttr);
					}
				} else {
					value = this.guessValue();
					attribute = this.guessAttribute(value);
					if(attribute in databind.bindings){
						bindings[attribute] = new Binding(this.element, attribute, value);
					}
				}
			}

			return bindings;
		},

		applyBindings: function(){

			for(var attribute in this.bindings){
				if(this.bindings.hasOwnProperty(attribute)){
					_currentBinding = this.bindings[attribute];
					if(_currentBinding.apply(_currentBinding.declaration, this.scope) === false){
						return; //prevent next bindings to apply
					}
				}
			}

			_currentBinding = null;

			if(this.innerScope !== null){
				this.parseChildren(this.innerScope);
			}
		},

		parseChildren: function(innerScope){
			var c, children;
			if(innerScope instanceof Scope && this.element.children) {
				children = [];
				for(c=0; c<this.element.children.length; c++){
					children.push(this.element.children[c]);
				}
				for(c=0; c<children.length; c++){
					if(children[c] instanceof Element){
						databind(children[c]).set(innerScope);
					}
				}
			}
		},

		guessValue: function(){
			var c, candidate, candidates = [];
			candidates = candidates
				.concat(this.element.id || [])
				.concat(this.element.getAttribute("name") || [])
				.concat(this.element.className.match(/[^ ]+/g) || []);
			for(c=0; c<candidates.length; c++){
				if(candidates[c] && (candidate = this.scope.resolve(candidates[c], this.element)) !== null){
					return candidates[c];
				}
			}
			throw new DatabinderError("No binding value suitable for element "+this.element.outerHTML);
		},

		guessAttribute: function(valueName){
			var value = this.scope.resolve(valueName, this.element);
			var type = value ? value.constructor : null;
			switch(true){
				case type===Object: return "with";
				case type===Array: return "loop";
				case value instanceof Element: return "html";
				case type===Boolean:
					if(this.element.constructor===HTMLInputElement && "checked" in this.element) return "checked";
					if(this.element.constructor===HTMLOptionElement) return "selected";
					return "if";
				case type===String:
				case type===Number:
					if(this.element.constructor===HTMLInputElement) return "value";
					if("src" in this.element) return "src";
					return "text";
				default:
					return "text";
			}
		}

	};

	function Scope(data, parent, databinding) {
		if(data instanceof Scope){
			return data;
		}
		this.databinding = databinding;
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
				scope = new Scope(data, scope, this.databinding);
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

				fn = fn.call(this.data, root.data, this.databinding.element);
			}
			return fn;
		},

		resolve: function(declaration, expectsFunction){
			var f, l, p, pl, params, resolvedParams, extension, extensionName;
			var extensions = declaration.split("|");
			var value = this.resolveParam(extensions.shift().trim());
			if(!expectsFunction) {
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

			if (obj instanceof Object === false) {
				return obj;
			}

			if(isArray){
				observable = obj.slice();
			} else if (isFunction(obj)){
			   observable = function(){ return obj.apply(this, arguments); };
			} else {
				observable = Object.create(Object.getPrototypeOf(obj), {});
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

	function Binding(element, attribute, declaration){
		var def = databind.bindings[attribute] || (("on" + attribute) in global ? databind.bindings.on : databind.defaultBinding);
		for(var prop in def){
			if(def.hasOwnProperty(prop)){
				this[prop] = def[prop];
			}
		}
		this.element = element;
		this.attribute = attribute;
		this.declaration = (declaration[0] === '{' ? this.getBindingSet(declaration) : declaration);

		if(isFunction(this.init)){
			this.init(element.databinding);
		}
	}

	Binding.prototype = {
		getBindingSet: function(declaration){
			var bindingSet = {};
			var pairs = declaration.slice(1,-1).split(',');
			for(var p=0, m=pairs.length; p < m; p++){
				var match = pairs[p].match(/(\w+):\s*([\w\.\/\|\s]+)/);
				if(match === null || match.length < 3){
					throw new DatabinderError("Invalid argument for binding set: "+pairs[p]);
				}
				bindingSet[match[1].trim()] = match[2].trim();
			}
			return bindingSet;
		},

		apply: function(declaration, scope){
			this.set(scope.resolve(declaration));
		},

		react: function(){
			this.apply(this.declaration, this.element.databinding.scope);
		}
	};

	var databind = function(selector, data){
		var element = selector instanceof Element ? selector : document.querySelector(selector);
		if(element === null){
			throw new DatabinderError("No element matched for selector "+selector);
		}
		var databinding = element.databinding || new DataBinding(element);
		if (data !== undefined) {
			databinding.set(data);
		}
		return databinding;
	};

	databind.defaultBinding = {
		set: function(value){
			if (value === null) {
				this.element.removeAttribute(this.attribute);
			} else if(value === true || value === false){
				this.element[this.attribute] = value;
			} else if(value !== undefined){
				this.element.setAttribute(this.attribute, value);
			}
		}
	};

	databind.bindings = {
		text: {
			init: function(databinding){
				databinding.innerScope = null;
			},
			get: function(){
				return this.element.textContent;
			},
			set: function(value){
				if(value !== undefined){
					this.element.textContent = value;
				}
			}
		},
		html: {
			init: function(databinding){
				databinding.innerScope = null;
			},
			set: function(value){
				if(value instanceof Element){
					this.element.innerHTML = "";
					this.element.appendChild(value);
				} else if(value !== undefined) {
					this.element.innerHTML = value;
				}
			}
		},
		style: {
			apply: function(declaration, scope){
				var p, value;
				if(declaration instanceof Object){
					for(p in declaration){
						if(declaration.hasOwnProperty(p)) {
							value = scope.resolve(declaration[p]);
							if (value !== undefined) {
								this.element.style[p] = value;
							}
						}
					}
				} else {
					value = scope.resolve(declaration);
					if(value instanceof Object){
						for(p in value){
							if(value.hasOwnProperty(p) && value[p] !== undefined){
								this.element.style[p] = value[p];
							}
						}
					} else {
						this.element.setAttribute("style", value);
					}
				}
			}
		},
		class: {
			apply: function(classList, scope){
				var className;
				if(classList instanceof Object){
					for(className in classList){
						if(classList.hasOwnProperty(className)){
							toggleClass(this.element, className, scope.resolve(classList[className]));
						}
					}
				} else {
					classList = scope.resolve(classList, this.element);
					if(Array.isArray(classList)){
						this.element.className = classList.join(' ');
					} else if(classList instanceof Object){
						for(className in classList){
							if(classList.hasOwnProperty(className)){
								toggleClass(this.element, className, classList[className]);
							}
						}
					} else {
						this.element.className = classList;
					}
				}
			}
		},
		if: {
			set: function(value, invert){
				if(Boolean(value) === Boolean(invert)){
					this.element.parentNode.removeChild(this.element);
					return false; //prevent other bindings to apply
				}
			}
		},
		ifnot: {
			set: function(value){
				return databind.bindings.if.set.call(this, value, true);
			}
		},
		visible: {
			set: function(value, invert){
				var visible = (Boolean(value) !== Boolean(invert));
				this.element.hidden = !visible;
				this.element.style.display = visible ? "" : "none";
			}
		},
		hidden: {
			set: function(value){
				return databind.bindings.visible.set.call(this, value, true);
			}
		},
		loop: {
			init: function(databinding){
				databinding.innerScope = null; //override parseChildren
			},
			apply: function (bindingSet, scope) {
				if(!isObject(bindingSet)){ bindingSet = { in : bindingSet }; }
				if (bindingSet["in"] === undefined) {
					throw new DatabinderError("No list specified for loop declaration: " + bindingSet);
				}
				this.list = bindingSet["in"];
				this.index = bindingSet["at"] || "loopIndex";
				this.item = bindingSet["as"] || "loopValue";
				this.childNodes = [];
				this.innerScope = scope.lookup(this.list, false);
				for (var i = 0, l = this.element.childNodes.length; i < l; i++) {
					this.childNodes.push(this.element.childNodes[i].cloneNode(true));
				}
				this.element.innerHTML = ""; //remove all child nodes
				this.parseChildren();
			},
			parseChildren: function(){
				var i, l, val, list;
				this.iterations = [];
				if(this.innerScope instanceof Scope) {
					list = this.innerScope.resolve(this.list, true);

					if(Array.isArray(list)){
						for(i=0, l=list.length; i<l; i++){
							this.iterations.push({key: i, value: list[i] });
						}
					} else if(isFunction(list)){
						for(i=0; (val = this.innerScope.evalFunction(list)) !== null; i++){
							this.iterations.push({key: i, value: val });
						}
					} else if(list instanceof Object) {
						for(i in list){
							if(list.hasOwnProperty(i)){
								this.iterations.push({key: i, value: list[i] });
							}
						}
					}

					for(i=0; i<this.iterations.length; i++){
						this.iterate(i);
					}
				}
			},
			iterate: function(i){
				var c, l, newChild, iteration = this.iterations[i];
				var scope = new Scope(iteration.value, this.innerScope, this);
				scope.data[this.index] = iteration.key;
				scope.data[this.item] = iteration.value;
				iteration.nodes = [];
				for(c=0, l=this.childNodes.length; c<l; c++){
					newChild = this.childNodes[c].cloneNode(true);
					iteration.nodes.push(newChild);
					if(this.iterations[i+1] && this.iterations[i+1].nodes){
						this.element.insertBefore(newChild, this.iterations[i+1].nodes[0]);
					} else {
						this.element.appendChild(newChild);
					}
					if(newChild instanceof Element){
						databind(newChild).set(scope);
					}
				}
			},
			react: function(change, signature){
				if(change === OBSERVATION.SPLICE){
					this.splice.apply(this, [].slice.call(arguments, 2));
				} else if(change === OBSERVATION.SET){
					var i, l, key, path = signature.split(".");
					if(path.length > 1){ //specific index modified
						key = path[1];
						for(i=0, l=this.iterations.length; i<l; i++){
							if(key == this.iterations[i].key){
								this.splice(i, 1, 1);
								break;
							}
						}
					} else {
						this.parseChildren(); //parse all items
					}
				}
			},
			splice: function(start, nbToRemove, nbToAdd) {
				var i, j, n, list;
				for(i = start; i < start + nbToRemove && i in this.iterations; i++) {
					for (j = 0, n = this.iterations[i].nodes.length; j < n; j++) {
						this.element.removeChild(this.iterations[i].nodes[j]); //TODO: some node references are lost, try to remove several items
					}
				}
				list = this.innerScope.resolve(this.list, true);
				for(i = start; i < start + nbToAdd; i++) {
					this.iterations[i] = {key: i, value: list[i] };
					this.iterate(i);
				}
			}
		},
		with: {
			set: function(value){
				this.element.databinding.innerScope = new Scope(value, this.element.databinding.scope, this.element.databinding);
			}
		},
		on: {
			apply: function (bindingSet, scope) {
				var eventType, fn, databinding, root, tmp;
				if(!isObject(bindingSet)) {
					if(typeof bindingSet === "string"){
						tmp = {};
						tmp[this.attribute] = bindingSet;
						bindingSet = tmp;
					} else {
						throw new DatabinderError('"on" binding expects a binding set, instead got ' + bindingSet);
					}
				}

				databinding = this.element.databinding;
				root = databinding.scope;
				while(root && root.parent){
					root = root.parent;
				}

				function makeHandler(fn){
					return function(event){
						fn.call(databinding.scope.data, event, root.data, databinding.element);
					};
				}

				for(eventType in bindingSet){
					if(bindingSet.hasOwnProperty(eventType)){
						fn = scope.resolve(bindingSet[eventType], databinding.element, true);
						if(isFunction(fn)){
							var handler = makeHandler(fn);
							if(eventType in databinding.eventListeners){
								this.element.removeEventListener(eventType, databinding.eventListeners[eventType]);
							}
							databinding.eventListeners[eventType] = handler;
							this.element.addEventListener(eventType, handler);
						}
					}
				}
			}
		},
		template: {
			apply: function(templateId){
				var template = document.getElementById(templateId);
				if(template === null){
					throw new DatabinderError("Template not found: "+templateId);
				}
				this.element.innerHTML = template.innerHTML;
			}
		}
	};

	databind.extensions = {};

	global[BINDING_GLOBAL] = databind;
	return databind;

})(this);