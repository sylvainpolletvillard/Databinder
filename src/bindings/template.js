databind.bindings.template = {
	set: function(scope){
		var templateId = scope.resolve(this.declaration);
		var template = document.getElementById(templateId);
		if(template === null){
			throw new DatabinderError("Template not found: "+templateId);
		}
		this.element.innerHTML = template.innerHTML;
	}
};