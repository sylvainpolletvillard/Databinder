databind.bindings.if = {
	init: function(element){
		this.parentNode = element.parentNode;
	},
	get: function(element){
		return (this.parentNode.childNodes.indexOf(element) >= 0);
	},
	set: function(element, scope, invert){
		var value = scope.resolve(this.declaration);
		if(Boolean(value) === Boolean(invert)){
			this.parentNode.removeChild(this.element);
			return false; //prevent other bindings to apply
			//TODO: element.databinding.ignoreNextBindings()
		}
	}
};