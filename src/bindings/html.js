databind.bindings.html = {
	init: function(){
		this.element.databinding.innerScope = null;
	},
	get: function(){
		return this.element.innerHTML;
	},
	set: function(scope){
		var value = scope.resolve(this.declaration);
		if(value instanceof Element){
			this.element.innerHTML = "";
			this.element.appendChild(value);
		} else if(value !== undefined) {
			this.element.innerHTML = value;
		}
	}
};