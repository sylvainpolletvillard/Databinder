databind.bindings.hidden = {
	get: function(element){
		return element.hidden;
	},
	set: function(element, scope){
		return databind.bindings.visible.set.call(this, element, scope, true);
	}
};