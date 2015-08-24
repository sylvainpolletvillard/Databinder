databind.bindings.loop = {
	init: function(){
		this.element.databinding.innerScope = null; //override parseChildren
	},
	get: function(){
		return this.element.childNodes;
	},
	set: function (scope) {
		var params = isObject(this.declaration) ? this.declaration : { in : this.declaration };
		if (params["in"] === undefined) {
			throw new DatabinderError("No list specified for loop declaration: " + params);
		}
		this.list = params["in"];
		this.index = params["at"] || "loopIndex";
		this.item = params["as"] || "loopValue";
		this.childNodes = [];
		this.innerScope = scope.lookup(this.list, false);
		for (var i = 0, l = this.element.childNodes.length; i < l; i++) {
			this.childNodes.push(this.element.childNodes[i].cloneNode(true));
		}
		this.element.innerHTML = ""; //remove all child nodes
		this.parseChildren();
	},
	parseChildren: function(){
		var i, l, val, list;
		this.iterations = [];
		if(this.innerScope instanceof Scope) {
			list = this.innerScope.resolve(this.list, true);

			if(Array.isArray(list)){
				for(i=0, l=list.length; i<l; i++){
					this.iterations.push({key: i, value: list[i] });
				}
			} else if(isFunction(list)){
				for(i=0; (val = this.innerScope.evalFunction(list)) !== null; i++){
					this.iterations.push({key: i, value: val });
				}
			} else if(list instanceof Object) {
				for(i in list){
					if(list.hasOwnProperty(i)){
						this.iterations.push({key: i, value: list[i] });
					}
				}
			}

			for(i=0; i<this.iterations.length; i++){
				this.iterate(i);
			}
		}
	},
	iterate: function(i){
		var c, l, newChild, iteration = this.iterations[i];
		var scope = new Scope(iteration.value, this.innerScope);
		scope.data[this.index] = iteration.key;
		scope.data[this.item] = iteration.value;
		iteration.nodes = [];
		for(c=0, l=this.childNodes.length; c<l; c++){
			newChild = this.childNodes[c].cloneNode(true);
			iteration.nodes.push(newChild);
			if(this.iterations[i+1] && this.iterations[i+1].nodes){
				this.element.insertBefore(newChild, this.iterations[i+1].nodes[0]);
			} else {
				this.element.appendChild(newChild);
			}
			if(newChild instanceof Element){
				databind(newChild).set(scope);
			}
		}
	},
	react: function(change, signature){
		if(change === OBSERVATION.SPLICE){
			this.splice.apply(this, [].slice.call(arguments, 2));
		} else if(change === OBSERVATION.SET){
			var i, l, key, path = signature.split(".");
			if(path.length > 1){ //specific index modified
				key = path[1];
				for(i=0, l=this.iterations.length; i<l; i++){
					if(key == this.iterations[i].key){
						this.splice(i, 1, 1);
						break;
					}
				}
			} else {
				this.parseChildren(); //parse all items
			}
		}
	},
	splice: function(start, nbToRemove, nbToAdd) {
		var i, j, n, list;
		for(i = start; i < start + nbToRemove && i in this.iterations; i++) {
			for (j = 0, n = this.iterations[i].nodes.length; j < n; j++) {
				this.element.removeChild(this.iterations[i].nodes[j]);
				//TODO: some node references are lost, try to remove several items
			}
		}
		list = this.innerScope.resolve(this.list, true);
		for(i = start; i < start + nbToAdd; i++) {
			this.iterations[i] = {key: i, value: list[i] };
			this.iterate(i);
		}
	}
};