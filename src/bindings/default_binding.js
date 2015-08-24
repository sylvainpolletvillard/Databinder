databind.defaultBinding = {
	get: function(){
		if(this.attribute in this.element){
			return this.element[this.attribute];
		}
		return this.element.getAttribute(this.attribute);
	},
	set: function(scope){
		var value = scope.resolve(this.declaration);
		if (value === null) {
			this.element.removeAttribute(this.attribute);
		} else if(this.attribute in this.element){
			this.element[this.attribute] = value;
		} else if(value !== undefined){
			this.element.setAttribute(this.attribute, value);
		}
	}
};