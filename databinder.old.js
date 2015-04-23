/*
 Databinder
 @version 0.8
 @author Sylvain Pollet-Villard
 @license MIT
 @website http://syllab.fr/projets/web/databinder/
 */

;(function(global){

	var BINDING_ATTRIBUTE = "data-bind";
	var BINDING_GLOBAL = "databind";
	var BINDINGS_REGEX = /(?:^|,)\s*(?:(\w+):)?\s*([\w\.\/\|\'\"\s-]+|{.+})+/g;
	var ARRAY_MUTATOR_METHODS = ["pop","push","reverse","shift","sort","splice","unshift"];

	function getTypeOf(obj) {
		return Object.prototype.toString.call(obj).match(/\s([a-zA-Z]+)/)[1];
	}

	function isFunction(obj){
		return getTypeOf(obj) === 'Function';
	}

	function DatabinderError(message){
		return new Error("[Databinder] "+message);
	}

	/* classList shim for IE9 */
	var classListSupported = ("classList" in document.createElement("p"));
	function toggleClass(elm, className, bool){
		if(!classListSupported){
			var classes = elm.className.split(" "),
				i = classes.indexOf(className);
			if(bool && i === -1){
				classes.push(className);
			} else if(!bool && i >= 0){
				classes.splice(i, 1);
			}
			elm.className = classes.join(" ").trim();
		} else {
			elm.classList[bool ? "add" : "remove"](className);
		}
	}

	function wrapPrimitives(obj){
		switch(getTypeOf(obj)){
			case "String": return new String(obj);
			case "Number": return new Number(obj);
			case "Boolean": return new Boolean(obj);
			default: return obj;
		}
	}

	function makeObservable(obj, observer){

		var observable,
			type = getTypeOf(obj),
			isArray = Array.isArray(obj);

		if(type !== "Object" && !isArray){
			return obj;
		}

		if(isArray){
			observable = obj.slice();
			ARRAY_MUTATOR_METHODS.forEach(function(method){
				Object.defineProperty(observable, method, { configurable: true, value: function(){
					console.log("---> OBSERVE: "+method);
					var returnValue = obj[method].apply(obj, arguments);
					makeObservable(obj, observer);
					observer.reset();
					return returnValue;
				}});
			});
		} else {
			observable = Object.create(obj);
		}

		Object.keys(obj).forEach(function(key){
			//console.log("MAKE OBSERVABLE",key,obj, observer);
			Object.defineProperty(observable, key, {
				get: function() {
					//console.log("---> OBSERVE: get "+key);
					if(obj[key] instanceof Object){
						return makeObservable(obj[key], observer);
					}
					return obj[key];
				},
				set: function(val) {
					console.log("---> OBSERVE: set "+key+" to "+val);
					obj[key]=val;
					observer.reset();
				}
			});
		});

		return observable;
	}

	var DataBinding = Object.create({

		set: function(data){
			this.scope = DataScope.init(data, null, this);
			this.data = this.scope.data;
			this.bindings = this.getBindings();
			return this.reset();
		},

		reset: function(){
			if(this.originalInnerHTML !== undefined){
				this.elm.innerHTML = this.originalInnerHTML;
			}
			this.parse();
			return this;
		},

		get: function(){
			if((this.elm instanceof HTMLInputElement || this.elm instanceof HTMLTextAreaElement) && "value" in this.bindings){
				this.scope.lookup(this.bindings.value, this.elm).data[this.bindings.value] = this.elm.value;
			}

			if(this.elm.children) {
				for(var c=0, l=this.elm.children.length; c<l; c++){
					var child = this.elm.children[c];
					if(DataBinding.isPrototypeOf(child.databinding)) {
						child.databinding.get();
					}
				}
			}
			return this;
		},

		getBindings: function(){
			var bindings = {}, value, attribute, bindingAttr;
			if(this.elm.hasAttribute(BINDING_ATTRIBUTE)){
				bindingAttr = this.elm.getAttribute(BINDING_ATTRIBUTE);
				if(bindingAttr) {
					var match = BINDINGS_REGEX.exec(bindingAttr);
					if (match === null) {
						throw DatabinderError("Invalid argument for data-binding: " + bindingAttr);
					}
					while (match !== null) {
						value = match[2] || this.guessValue();
						attribute = match[1] || this.guessAttribute(value);
						bindings[attribute] = value;
						match = BINDINGS_REGEX.exec(bindingAttr);
					}
				} else {
					value = this.guessValue();
					attribute = this.guessAttribute(value);
					bindings[attribute] = value;
				}
			}

			return bindings;
		},

		parse: function(){
			var binding, bindingSet, loop, attribute, value, innerScope = this.scope;

			for(attribute in this.bindings){
				if(this.bindings.hasOwnProperty(attribute)){
					value = this.bindings[attribute];

					if(value[0] === '{'){
						bindingSet = {};
						var pairs = value.slice(1,-1).split(',');
						for(var p=0, m=pairs.length; p < m; p++){
							var match = pairs[p].match(/(\w+):\s*([\w\.\/\|\s]+)/);
							if(match === null || match.length < 3){
								throw DatabinderError("Invalid argument for binding set: "+pairs[p]);
							}
							bindingSet[match[1].trim()] = match[2].trim();
						}
					}

					switch(attribute){
						case "text":
							this.bindText(this.scope.resolve(value, this.elm));
							innerScope = null;
							break;
						case "html":
							this.bindHTML(this.scope.resolve(value, this.elm));
							innerScope = null;
							break;
						case "with":
							innerScope = DataScope.init(this.scope.resolve(value, this.elm), this.scope, this);
							break;
						case "loop":
							innerScope = this.bindLoop(bindingSet || { in: value });
							break;
						case "if":
							if(this.bindIf(value, true)) return;
							break;
						case "ifnot":
							if(this.bindIf(value, false)) return;
							break;
						case "visible":
							this.bindVisibility(value, true);
							break;
						case "hidden":
							this.bindVisibility(value, false);
							break;
						case "style":
							this.bindStyle(bindingSet || value);
							break;
						case "class":
							this.bindClass(bindingSet || value);
							break;
						case "on":
							this.bindEvents(bindingSet);
							break;
						case "template":
							this.bindTemplate(value);
							break;
						default:
							if( ("on" + attribute) in global){
								var eventBinding = {};
								eventBinding[attribute] = value;
								this.bindEvents(eventBinding);
							} else {
								this.bindAttribute(attribute, this.scope.resolve(value, this.elm));
							}
							break;
					}
				}
			}

			if(this.loop !== undefined) {
				this.parseLoop(innerScope);
			} else if(innerScope !== null){
				this.parseChildren(innerScope);
			}
		},

		bindText: function(value){
			if(value !== undefined){
				this.elm.textContent = value;
			}
		},

		bindHTML: function(value){
			if(value instanceof Element){
				this.elm.innerHTML = "";
				this.elm.appendChild(value);
			} else if(value !== undefined) {
				this.elm.innerHTML = value;
			}
		},

		bindAttribute: function(attr, value){
			if (value === null) {
				this.elm.removeAttribute(attr);
			} else if(value === true || value === false){
				this.elm[attr] = value;
			} else if(value !== undefined){
				this.elm.setAttribute(attr, value);
			}
		},

		bindStyle: function(value){
			var p, r;
			if(value instanceof Object){
				for(p in value){
					if(value.hasOwnProperty(p) && (r = this.scope.resolve(value[p], this.elm)) !== undefined ){
						this.elm.style[p] = r;
					}
				}
			} else {
				value = this.scope.resolve(value, this.elm);
				if(value instanceof Object){
					for(p in value){
						if(value.hasOwnProperty(p) && value[p] !== undefined){
							this.elm.style[p] = value[p];
						}
					}
				} else {
					this.bindAttribute("style", value);
				}
			}
		},

		bindClass: function(classList){
			var className;
			if(classList instanceof Object){
				for(className in classList){
					if(classList.hasOwnProperty(className)){
						var bool = this.scope.resolve(classList[className], this.elm);
						toggleClass(this.elm, className, bool);
					}
				}
			} else {
				classList = this.scope.resolve(classList, this.elm);
				if(Array.isArray(classList)){
					this.elm.className = classList.join(' ');
				} else if(classList instanceof Object){
					for(className in classList){
						if(classList.hasOwnProperty(className)){
							toggleClass(this.elm, className, classList[className]);
						}
					}
				} else {
					this.elm.className = classList;
				}
			}
		},

		bindIf: function(value, bool){
			if(Boolean(this.scope.resolve(value, this.elm)) !== bool){
				this.elm.parentNode.removeChild(this.elm);
				return true; //stops parsing
			}
			return false;
		},

		bindVisibility: function(value, bool){
			this.elm.style.display = Boolean(this.scope.resolve(value, this.elm)) === bool ? "" : "none";
		},

		bindEvents: function(bindingSet){
			var eventType, fn, dbe, root;
			if(bindingSet === undefined){
				throw DatabinderError('"on" binding expects a binding set, instead got ' +bindingSet);
			}

			dbe = this;
			root = dbe.scope;
			while(root && root.parent){
				root = root.parent;
			}

			function makeHandler(fn){
				return function(event){
					fn.call(dbe.scope.data, event, root.data, dbe.elm);
				};
			}

			for(eventType in bindingSet){
				if(bindingSet.hasOwnProperty(eventType)){
					fn = this.scope.resolve(bindingSet[eventType], dbe.elm, true);
					if(isFunction(fn)){
						var handler = makeHandler(fn);
						if(eventType in this.eventListeners){
							this.elm.removeEventListener(eventType, this.eventListeners[eventType]);
						}
						this.eventListeners[eventType] = handler;
						this.elm.addEventListener(eventType, handler);
					}
				}
			}
		},

		bindLoop: function(bindingSet){
			if (bindingSet["in"] === undefined) {
				throw DatabinderError("No list specified for loop declaration: " + bindingSet);
			}
			this.loop = {
				list: bindingSet["in"],
				index: bindingSet["at"] || "loopIndex",
				item: bindingSet["as"] || "loopValue"
			};
			return this.scope.lookup(bindingSet["in"], this.elm, false);
		},

		bindTemplate: function(templateId){
			var template = document.getElementById(templateId);
			if(template === null){
				throw DatabinderError("Template not found: "+templateId);
			}
			this.elm.innerHTML = template.innerHTML;
		},

		parseChildren: function(innerScope){
			var c, children;
			if(DataScope.isPrototypeOf(innerScope) && this.elm.children) {
				children = [];
				for(c=0; c<this.elm.children.length; c++){
					children.push(this.elm.children[c]);
				}
				for(c=0; c<children.length; c++){
					if(children[c] instanceof Element){
						databind(children[c]).set(innerScope);
					}
				}
			}
		},

		parseLoop: function(innerScope){
			var i, l, children, list;

			if(DataScope.isPrototypeOf(innerScope)) {
				children = [];
				for (i=0, l=this.elm.childNodes.length; i<l; i++) {
					children.push(this.elm.childNodes[i].cloneNode(true));
				}
				this.elm.innerHTML = ""; //remove all child nodes
				list = innerScope.resolve(this.loop.list, this.elm, true);

				if(Array.isArray(list)){
					for(i=0; i<list.length; i++){
						this.iterate(i, list[i], children, innerScope);
					}
				} else if(isFunction(list)){
					for(i=0; (l = innerScope.evalFunction(list)) !== null; i++){
						this.iterate(i, l, children, innerScope);
					}
				} else if(list instanceof Object) {
					for(i in list){
						if(list.hasOwnProperty(i)){
							this.iterate(i, list[i], children, innerScope);
						}
					}
				}
			}
		},

		iterate: function(key, value, children, innerScope){
			var c, l, newChild;
			var data = wrapPrimitives(value);
			var scope = DataScope.init(data, innerScope, this);
			scope.loopItem = this.loop.item;
			scope.loopIndex = this.loop.index;
			scope.data[this.loop.index] = key;
			scope.data[this.loop.item] = data;
			for(c=0, l=children.length; c<l; c++){
				newChild = children[c].cloneNode(true);
				this.elm.appendChild(newChild);
				if(newChild instanceof Element){
					databind(newChild).set(scope);
				}
			}
		},

		guessValue: function(){
			var c, candidate, candidates = [];
			candidates = candidates
				.concat(this.elm.id || [])
				.concat(this.elm.getAttribute("name") || [])
				.concat(this.elm.className.match(/[^ ]+/g) || []);
			for(c=0; c<candidates.length; c++){
				if(candidates[c] && (candidate = this.scope.resolve(candidates[c], this.elm)) !== null){
					return candidates[c];
				}
			}
			throw DatabinderError("No binding value suitable for element "+this.elm.outerHTML);
		},

		guessAttribute: function(valueName){
			var value = this.scope.resolve(valueName, this.elm);
			var type = getTypeOf(value);
			switch(true){
				case type==="Object": return "with";
				case type==="Array": return "loop";
				case value instanceof Element: return "html";
				case type==="Boolean":
					if(getTypeOf(this.elm)==="HTMLInputElement" && "checked" in this.elm) return "checked";
					if(getTypeOf(this.elm)==="HTMLOptionElement") return "selected";
					return "if";
				case type==="String":
				case type==="Number":
					if(getTypeOf(this.elm)==="HTMLInputElement") return "value";
					if("src" in this.elm) return "src";
					return "text";
				default:
					return "text";
			}
		}

	});

	var DataScope = Object.create({

		init: function(data, parent, databinding) {
			if(DataScope.isPrototypeOf(data)){
				return data;
			}
			var ds = Object.create(DataScope);
			ds.databinding = databinding;
			ds.data = makeObservable(data || {}, databinding);
			ds.parent = parent;
			return ds;
		},

		//Getting a scope centered on value by name
		lookup: function(name, element, inner) {
			var value, names, i, l;
			var scope = this;

			if(name === "."){
				return scope;
			}

			if (name[0] === '/') {
				while(scope.parent){
					scope = scope.parent;
				}
				name = name.slice(1);
			} else if(name[0] === "."){
				i = 0;
				while(name[++i] === '.' && scope.parent){
					scope = scope.parent;
				}
				name = name.slice(i);
			} else {
				//Lookup to find a scope with a matching value
				value = name.split(".")[0];
				while(scope.data[value] === undefined && scope.parent){
					scope = scope.parent;
				}
			}

			names = name.split('.');
			value = scope.data;
			i = 0;
			l = names.length - 1;
			if(inner === true){
				l++;
			}

			//stops to penultimate name
			while (value !== undefined && i < l) {
				value = value[names[i++]];
				if(isFunction(value)){
					value = this.evalFunction(value, element);
				}
				scope = DataScope.init(value, scope, this.databinding);
			}

			return scope;
		},

		evalFunction: function(value, element){
			var root;
			if(isFunction(value)){
				root = this;
				while(root && root.parent){
					root = root.parent;
				}
				value = value.call(this.data, root.data, element);
			}
			return value;
		},

		resolve: function(declaration, element, expectsFunction){
			var f, l, p, pl, params, resolvedParams, extension, extensionName;
			var extensions = declaration.split("|");
			var value = this.resolveParam(extensions.shift().trim(), element);
			if(!expectsFunction) {
				value = this.evalFunction(value, element);
			}
			if(extensions.length > 0){
				for (f = 0, l = extensions.length; f < l; f++) {
					params = extensions[f].trim().split(/\s+/);
					extensionName = params.shift();
					extension = databind.extensions[extensionName];
					if(extension !== undefined && isFunction(extension)){
						resolvedParams = [];
						for(p = 0, pl = params.length; p < pl; p++){
							resolvedParams.push(this.resolveParam(params[p], element));
						}
						value = extension.apply(value, resolvedParams);
					} else {
						throw DatabinderError("Unknown extension: " + extensionName);
					}
				}
			}
			return value;
		},

		resolveParam: function(param, element){
			if(!isNaN(param)){
				return +param; //inline Number
			}
			if(param[0] === '"' || param[0] === "'"){
				return param.slice(1, -1); //inline String
			}
			var scope = this.lookup(param, element, false);
			if(param === "."){
				return scope.data;
			}
			return scope.data[param.match(/([^\/\.\s]+)\s*$/)[1]];
		}
	});

	var databind = function(selector, data){
		var db, elm = selector instanceof Element ? selector : document.querySelector(selector);
		if(elm === null){
			throw DatabinderError("No element matched for selector "+selector);
		}
		if(elm.databinding) {
			db = elm.databinding;
		} else {
			db = Object.create(DataBinding);
			db.eventListeners = {};
			db.originalInnerHTML = elm.innerHTML;
			db.elm = elm;
			db.bindings = {};
			elm.databinding = db;
		}
		if(data !== undefined){
			db.set(data);
		}
		return db;
	};

	databind.extensions = {};
	global[BINDING_GLOBAL] = databind;
	return databind;

})(this);