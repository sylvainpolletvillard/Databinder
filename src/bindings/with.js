databind.bindings.with = {
	set: function(scope){
		var value = scope.resolve(this.declaration);
		this.element.databinding.innerScope = new Scope(value, scope);
	}
};