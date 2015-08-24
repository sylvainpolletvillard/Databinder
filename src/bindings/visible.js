databind.bindings.visible = {
	get: function(){
		return !this.element.hidden;
	},
	set: function(scope, invert){
		var value = scope.resolve(this.declaration);
		var hidden = (Boolean(value) === Boolean(invert));
		this.element.hidden = hidden;
		this.element.style.display = hidden ? "none" : "";
	}
};