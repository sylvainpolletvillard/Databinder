databind.bindings.class = {
	get: function(){
		return classListSupported ? this.element.classList : this.element.className.split(/\s+/);
	},
	set: function(scope){
		var className;
		if(this.declaration instanceof Object){
			for(className in this.declaration){
				if(this.declaration.hasOwnProperty(className)){
					toggleClass(this.element, className, scope.resolve(this.declaration[className]));
				}
			}
		} else {
			var classList = scope.resolve(this.declaration);
			if(Array.isArray(classList)){
				this.element.className = classList.join(' ');
			} else if(classList instanceof Object){
				for(className in classList){
					if(classList.hasOwnProperty(className)){
						toggleClass(this.element, className, classList[className]);
					}
				}
			} else {
				this.element.className = classList;
			}
		}
	}
};