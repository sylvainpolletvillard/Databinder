function databind(selector, data){
	var element = selector instanceof Element ? selector : document.querySelector(selector);
	if(element === null){
		throw new DatabinderError("No element matched for selector "+selector);
	}
	var databinding = element.databinding || new DataBinding(element);
	if (data !== undefined) {
		databinding.set(data);
	}
	return databinding;
}

databind.bindings = {};
databind.extensions = {};