databind.bindings.ifnot = {
	init: function(){
		return databind.bindings.if.init.apply(this, arguments);
	},
	get: function(){
		return !databind.bindings.if.get.apply(this, arguments);
	},
	set: function(scope){
		return databind.bindings.if.set.call(this, scope, true);
	}
};