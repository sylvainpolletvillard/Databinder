function isFunction(obj) {
	return typeof obj === "function";
}

function isObject(obj) {
	return typeof obj === "object";
}

function wrapPrimitives(obj){
	switch(typeof obj){
		/*jshint -W053 */
		case "string": return new String(obj);
		case "number": return new Number(obj);
		case "boolean": return new Boolean(obj);
		default: return obj;
	}
}

/* classList shim for IE9 */
var classListSupported = ("classList" in document.createElement("p"));

function toggleClass(element, className, bool) {
	if (!classListSupported) {
		var classes = element.className.split(" "),
			i = classes.indexOf(className);
		if (bool && i === -1) {
			classes.push(className);
		} else if (!bool && i >= 0) {
			classes.splice(i, 1);
		}
		element.className = classes.join(" ").trim();
	} else {
		element.classList[bool ? "add" : "remove"](className);
	}
}

function DatabinderError(message) {
	this.name = 'DatabinderError';
	this.message = message;
}

DatabinderError.prototype = new Error();
DatabinderError.prototype.constructor = DatabinderError;