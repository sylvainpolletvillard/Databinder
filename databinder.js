/*
 Databinder
 @version 0.6
 @author Sylvain Pollet-Villard
 @license MIT
 @website http://syllab.fr/projets/web/databinder/
 */

;(function(global){

	var BINDING_ATTRIBUTE = "data-bind";
	var BINDING_GLOBAL = "databind";
	var BINDINGS_REGEX = /(?:^|,)\s*(?:(\w+):)?\s*([\w\.\/\|\s-]+|{.+})+/g;

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

	function getCopyRef(obj){
		var copy, type = getTypeOf(obj);
		if (type in global) {
			copy = new global[type](obj);
		} else {
			copy = obj;
		}
		if (copy instanceof Object) {
			for (var attr in obj) {
				if(obj.hasOwnProperty(attr)){
					copy[attr] = obj[attr];
				}
			}
		}
		return copy;
	}

	var DataBoundElement = Object.create({

		set: function(data){
			this.scope = DataScope.init(data);
			return this.reset();
		},

		reset: function(){
			if(this.originalHTML !== undefined){
				this.elm.innerHTML = this.originalHTML;
			}
			this.parse();
			return this;
		},

		get: function(){
			for(var b, i=0, l=this.bindings.length; b = this.bindings[i], i<l; i++) {
				if((this.elm instanceof HTMLInputElement && b.attribute === "value") ||
					(this.elm instanceof HTMLTextAreaElement && ["value","text","html"].indexOf(b.attribute) > 0)){
					this.scope.lookup(b.value, this.elm).data[b.value] = this.elm.value;
				}
			}
			if(this.elm.children) {
				for(var c=0; c<this.elm.children.length; c++){
					var child = this.elm.children[c];
					if(DataBoundElement.isPrototypeOf(child.databinding)) {
						child.databinding.get();
					}
				}
			}
			return this;
		},

		getBindings: function(){
			var bindings = [],
				bindingAttr = this.elm.getAttribute(BINDING_ATTRIBUTE);
			if(bindingAttr === ""){
				return [{ attribute: undefined, value: undefined }];
			}
			if(bindingAttr !== null){
				var match = BINDINGS_REGEX.exec(bindingAttr);
				if(match === null){
					throw DatabinderError("Invalid argument for data-binding: "+bindingAttr);
				}
				while (match !== null) {
					bindings.push({ attribute: match[1], value: match[2] });
					match = BINDINGS_REGEX.exec(bindingAttr);
				}
			}
			return bindings;
		},

		parse: function(){
			var binding, bindingSet, loop, innerScope = this.scope;
			for(var b=0, l=this.bindings.length; binding = this.bindings[b], b<l; b++){
				if(binding.value === undefined){
					binding.value = this.guessValue();
				} else if(binding.value[0] === '{'){
					bindingSet = {};
					var pairs = binding.value.slice(1,-1).split(',');
					for(var p=0, m=pairs.length; p < m; p++){
						var match = pairs[p].match(/(\w+):\s*([\w\.\/\|\s]+)/);
						if(match === null || match.length < 3){
							throw DatabinderError("Invalid argument for binding set: "+pairs[p]);
						}
						bindingSet[match[1].trim()] = match[2].trim();
					}
				}
				if(binding.attribute === undefined){
					binding.attribute = this.guessAttribute(binding.value);
				}

				switch(binding.attribute){
					case "text":
						this.bindText(this.scope.resolve(binding.value, this.elm));
						innerScope = null;
						break;
					case "html":
						this.bindHTML(this.scope.resolve(binding.value, this.elm));
						innerScope = null;
						break;
					case "with":
						innerScope = this.scope.lookup(binding.value, this.elm, true);
						break;
					case "loop":
						var t = this.bindLoop(bindingSet || { in: binding.value });
						innerScope = t.scope;
						loop = t.loop;
						break;
					case "if":
						if(this.bindIf(binding.value, true)) return;
						break;
					case "ifnot":
						if(this.bindIf(binding.value, false)) return;
						break;
					case "visible":
						this.bindVisibility(binding.value, true);
						break;
					case "hidden":
						this.bindVisibility(binding.value, false);
						break;
					case "style":
						this.bindStyle(bindingSet || binding.value);
						break;
					case "class":
						this.bindClass(bindingSet || binding.value);
						break;
					case "on":
						this.bindEvents(bindingSet);
						break;
					case "template":
						this.bindTemplate(binding.value);
						break;
					default:
						if( ("on" + binding.attribute) in global){
							var eventBinding = {};
							eventBinding[binding.attribute] = binding.value;
							this.bindEvents(eventBinding);
						} else {
							this.bindAttribute(binding.attribute, this.scope.resolve(binding.value, this.elm));
						}
						break;
				}
			}

			if(innerScope !== null){
				this.bindChildren(innerScope, loop);
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
			return {
				scope: this.scope.lookup(bindingSet["in"], this.elm, false),
				loop: {
					"list": bindingSet["in"],
					"index": bindingSet["at"] || "loopIndex",
					"item": bindingSet["as"] || "loopValue"
				}
			};
		},

		bindTemplate: function(templateId){
			var template = document.getElementById(templateId);
			if(template === null){
				throw DatabinderError("Template not found: "+templateId);
			}
			this.elm.innerHTML = template.innerHTML;
		},

		bindChildren: function(innerScope, loop){
			var i, c, children, list, newChild, loopFn;

			function iterate(elm, idx){
				var c;
				var iterationData = getCopyRef(list[idx]);
				var iterationScope = DataScope.init(iterationData, innerScope);
				iterationScope.loopIteration = loop;
				iterationScope.data[loop.index] = idx;
				iterationScope.data[loop.item] = list[idx];
				for(c = 0; c < children.length; c++){
					newChild = children[c].cloneNode(true);
					elm.appendChild(newChild);
					if(newChild instanceof Element) {
						databind(newChild).set(iterationScope);
					}
				}
				if(loopFn){
					list = innerScope.evalFunction(loopFn);
				}
			}

			if(DataScope.isPrototypeOf(innerScope)){
				children = [];
				if(loop !== undefined){
					for(c=0; c<this.elm.childNodes.length; c++){
						children.push(this.elm.childNodes[c].cloneNode(true));
					}
					this.elm.innerHTML=""; //remove all child nodes

					list = innerScope.data[loop.list]; //TODO: apply resolve for function eval and extensions
					if(isFunction(list)){
						loopFn = list;
						list = innerScope.evalFunction(list);
					}

					if(Array.isArray(list)){
						for(i=0; i<list.length; i++){
							iterate(this.elm, i);

						}
					} else if(list instanceof Object){
						for(i in list){
							if(list.hasOwnProperty(i)){
								iterate(this.elm, i);
							}
						}
					}
				} else if(this.elm.children) {
					for(c=0; c<this.elm.children.length; c++){
						children.push(this.elm.children[c]);
					}
					for(c=0; c<children.length; c++){
						if(children[c] instanceof Element){
							databind(children[c]).set(innerScope);
						}
					}
				}
			}
		},

		guessValue: function(){
			var c, candidate, candidates = [];
			var id = this.elm.id;
			var name = this.elm.getAttribute("name");
			var classes = this.elm.className.split(" ");
			candidates = candidates.concat(id).concat(name).concat(classes);
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

		init: function(data, parent) {
			if(DataScope.isPrototypeOf(data)){
				return data;
			}
			var ds = Object.create(DataScope);
			ds.data = data || {};
			ds.parent = parent;
			return ds;
		},

		//Getting a scope centered on value by name
		lookup: function(name, element, inner) {
			var scope = this, value, names, i, l;

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
				scope = DataScope.init(value, scope);
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
			var f, l, params, extension, extensionName;
			var extensions = declaration.split("|");
			var name = extensions.shift().trim();
			var scope = this.lookup(name, element, false);
			var value = (name === "." ? scope.data : scope.data[name.match(/([^\/\.\s]+)\s*$/)[1]]);
			var resolveParam = function(param){
				if(!isNaN(param)){
					return +param; //inline Number
				}
				if(param[0] != '"' || param[0] != "'"){
					return param.slice(1, -1); //inline String
				}
				return this.resolve(param, element, true);
			};

			if(!expectsFunction) {
				value = this.evalFunction(value, element);
			}
			if(extensions.length > 0){
				for (f = 0, l = extensions.length; f < l; f++) {
					params = extensions[f].trim().split(/\s+/);
					extensionName = params.shift();
					extension = databind.extensions[extensionName];
					if(extension !== undefined && isFunction(extension)) {
						value = extension.apply(value, params.map(resolveParam));
					} else {
						throw DatabinderError("Unknown extension: " + extensionName);
					}
				}
			}
			return value;
		}
	});

	var databind = function(selector){
		var elm = selector instanceof Element ? selector : document.querySelector(selector);
		if(elm === null){
			throw DatabinderError("No element matched for selector "+selector);
		}
		if(elm.databinding){
			return elm.databinding;
		}
		var dbe = Object.create(DataBoundElement);
		dbe.eventListeners = {};
		dbe.originalHTML = elm.innerHTML;
		dbe.elm = elm;
		dbe.bindings = dbe.getBindings();
		elm.databinding = dbe;
		return dbe;
	};

	databind.extensions = {};
	global[BINDING_GLOBAL] = databind;
	return databind;

})(this);