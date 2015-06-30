databind.bindings.text = {
	init: function(element){
		element.databinding.innerScope = null;
	},
	get: function(element){
		return element.textContent;
	},
	set: function(element,scope){
		var value = scope.resolve(this.declaration);
		if(value !== undefined){
			element.textContent = value;
		}
	}
};