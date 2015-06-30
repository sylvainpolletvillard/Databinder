databind.bindings.template = {
	set: function(element){
		var template = document.getElementById(this.declaration);
		if(template === null){
			throw new DatabinderError("Template not found: "+this.declaration);
		}
		element.innerHTML = template.innerHTML;
	}
};