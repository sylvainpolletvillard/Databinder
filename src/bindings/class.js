databind.bindings.class = {
	get: function(element){
		return classListSupported ? element.classList : element.className.split(/\s+/);
	},
	set: function(element, scope){
		var className;
		if(this.declaration instanceof Object){
			for(className in this.declaration){
				if(this.declaration.hasOwnProperty(className)){
					toggleClass(element, className, scope.resolve(this.declaration[className]));
				}
			}
		} else {
			var classList = scope.resolve(this.declaration);
			if(Array.isArray(classList)){
				element.className = classList.join(' ');
			} else if(classList instanceof Object){
				for(className in classList){
					if(classList.hasOwnProperty(className)){
						toggleClass(element, className, classList[className]);
					}
				}
			} else {
				element.className = classList;
			}
		}
	}
};