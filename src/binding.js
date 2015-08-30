function Binding(element, attribute, declaration){
	var def;
	if(databind.bindings.hasOwnProperty(attribute)) {
		def = databind.bindings[attribute];
	} else if (("on" + attribute) in global){
		def = databind.bindings.on;
		declaration = '{' + attribute +':' + declaration +'}';
	} else {
		def = databind.defaultBinding;
	}

	//TODO: use composition everywhere
	for(var prop in def){
		if(def.hasOwnProperty(prop)){
			this[prop] = def[prop];
		}
	}
	this.element = element;
	this.attribute = attribute;
	this.declaration = (declaration[0] === '{' ? this.getBindingSet(declaration) : declaration);
	this.inputable = (declaration.indexOf('|') === -1 && isFunction(this.get) && element.matches("input,textarea,select,[contenteditable]"));

	if(this.inputable) {
		if(element.matches("input,textarea") && attribute === "value") {
			element.addEventListener("input", this.handleInput.bind(this));
		}
		if(element.tagName === "SELECT" && attribute === "value") {
			element.addEventListener("change", this.handleInput.bind(this));
		}
		if(element.isContentEditable && (attribute === "text" || attribute === "html")) {
			element.addEventListener("input", this.handleInput.bind(this));
		}
	}

	if(isFunction(this.init)){
		this.init();
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

	react: function(){
		_currentBinding = this;
		var db = this.element.databinding;
		this.set(db.scope);
		if(db.innerScope !== null){
			db.parseChildren(db.innerScope);
		}
	},

	handleInput: function(){
		this.element.databinding.scope.setValueFromBinding(this);
	}
};