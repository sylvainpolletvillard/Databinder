databind.bindings.if = {
	init: function(){
		this.parentNode = this.element.parentNode;
	},
	get: function(){
		return (this.parentNode.childNodes.indexOf(this.element) >= 0);
	},
	set: function(scope, invert){
		var value = scope.resolve(this.declaration);
		if(Boolean(value) === Boolean(invert)){
			if(this.parentNode && this.parentNode.contains(this.element)){
				this.parentNode.removeChild(this.element);
			}
			return false; //prevent other bindings to apply
			//TODO: element.databinding.ignoreNextBindings()
		}
	}
};