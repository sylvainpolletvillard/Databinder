databind.bindings.with = {
	set: function(element, scope){
		var value = scope.resolve(this.declaration);
		element.databinding.innerScope = new Scope(value, scope);
	}
};