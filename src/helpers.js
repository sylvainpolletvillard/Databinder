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

if (Element && !Element.prototype.matches) {
	var p = Element.prototype;
	p.matches = p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector ||	p.oMatchesSelector || p.webkitMatchesSelector || function (selector) {
		var element = this, matches = (element.document || element.ownerDocument).querySelectorAll(selector), i=0;
		while (matches[i] && matches[i] !== element) { i++; }
		return !!matches[i];
	};
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