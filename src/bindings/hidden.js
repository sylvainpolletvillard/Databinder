databind.bindings.hidden = {
	get: function(){
		return this.element.hidden;
	},
	set: function(scope){
		return databind.bindings.visible.set.call(this, scope, true);
	}
};