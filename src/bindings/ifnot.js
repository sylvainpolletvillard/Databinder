databind.bindings.ifnot = {
	init: function(){
		return databind.bindings.if.init.apply(this, arguments);
	},
	get: function(){
		return !databind.bindings.if.get.apply(this, arguments);
	},
	set: function(element, scope){
		return databind.bindings.if.set.call(this, element, scope, true);
	}
};