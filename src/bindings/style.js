databind.bindings.style = {
	get: function(){
		return this.element.style;
	},
	set: function(scope){
		var p, value;
		if(this.declaration instanceof Object){
			for(p in this.declaration){
				if(this.declaration.hasOwnProperty(p)) {
					value = scope.resolve(this.declaration[p]);
					if (value !== undefined) {
						this.element.style[p] = value;
					}
				}
			}
		} else {
			value = scope.resolve(this.declaration);
			if(value instanceof Object){
				for(p in value){
					if(value.hasOwnProperty(p) && value[p] !== undefined){
						this.element.style[p] = value[p];
					}
				}
			} else {
				this.element.setAttribute("style", value);
			}
		}
	}
};