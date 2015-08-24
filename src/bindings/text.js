databind.bindings.text = {
	init: function(){
		this.element.databinding.innerScope = null;
	},
	get: function(){
		return this.element.textContent;
	},
	set: function(scope){
		var value = scope.resolve(this.declaration);
		if(value !== undefined){
			this.element.textContent = value;
		}
	}
};