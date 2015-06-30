var BINDINGS_REGEX = /(?:^|,)\s*(?:(\w+):)?\s*([\w\.\/\|'"\s-]+|{.+})+/g;
var _currentBinding;

function DataBinding(element) {
	this.bindings = {};
	this.originalInnerHTML = element.innerHTML;
	this.element = element;
	element.databinding = this;
}

DataBinding.prototype = {

	set: function(data){
		this.scope = new Scope(data, null);
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
		if(this.element.hasAttribute(DB_ATTRIBUTE)){
			bindingAttr = this.element.getAttribute(DB_ATTRIBUTE);
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
				if(attribute != null){
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
				if(_currentBinding.set(this.element, this.scope) === false){
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
			if(candidates[c] && (candidate = this.scope.resolve(candidates[c], true)) !== null){
				return candidates[c];
			}
		}
		throw new DatabinderError("No binding value suitable for element",this.element);
	},

	guessAttribute: function(valueName){
		var value = this.scope.resolve(valueName, true);
		if(value === null || value === undefined){
			return null;
		} else if(isFunction(value)){
			throw new DatabinderError("Cannot guess binding when value is a function", this.element);
		}
		var type = value.constructor;
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