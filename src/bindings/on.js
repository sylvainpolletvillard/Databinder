databind.bindings.on = {
	init: function(){
		this.eventListeners = {};
	},
	set: function (scope) {
		if(!isObject(this.declaration)) {
			throw new DatabinderError('"on" binding expects a binding set, instead got ' + this.declaration);
		}

		var eventType, fn;
		var root = scope;
		while(root && root.parent){
			root = root.parent;
		}

		function makeHandler(fn, element){
			return function(event){
				fn.call(scope.data, event, root.data, element);
			};
		}

		for(eventType in this.declaration){
			if(this.declaration.hasOwnProperty(eventType)){
				fn = scope.resolve(this.declaration[eventType], true);
				if(isFunction(fn)){
					var handler = makeHandler(fn, this.element);
					if(eventType in this.eventListeners){
						this.element.removeEventListener(eventType, this.eventListeners[eventType]);
					}
					this.eventListeners[eventType] = handler;
					this.element.addEventListener(eventType, handler);
				}
			}
		}
	}
};