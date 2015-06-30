databind.bindings.visible = {
	get: function(element){
		return !element.hidden;
	},
	set: function(element, scope, invert){
		var value = scope.resolve(this.declaration);
		var hidden = (Boolean(value) === Boolean(invert));
		element.hidden = hidden;
		element.style.display = hidden ? "none" : "";
	}
};