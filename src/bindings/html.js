databind.bindings.html = {
	init: function(element){
		element.databinding.innerScope = null;
	},
	get: function(element){
		return element.innerHTML;
	},
	set: function(element, scope){
		var value = scope.resolve(this.declaration);
		if(value instanceof Element){
			element.innerHTML = "";
			element.appendChild(value);
		} else if(value !== undefined) {
			element.innerHTML = value;
		}
	}
};