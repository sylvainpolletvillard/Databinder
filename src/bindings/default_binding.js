databind.defaultBinding = {
	get: function(element){
		return element.getAttribute(this.attribute);
	},
	set: function(element, scope){
		var value = scope.resolve(this.declaration);
		if (value === null) {
			element.removeAttribute(this.attribute);
		} else if(value === true || value === false){
			element[this.attribute] = value;
		} else if(value !== undefined){
			element.setAttribute(this.attribute, value);
		}
	}
};