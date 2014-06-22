(function($, databind){
	if(!$) return;

	$.fn.databind = function (){
		return this.each(function(data){
			databind(this);
			if(data !== undefined) {
				this.databinding.set(data);
			}
		});
	};
	$.each(["get","set","reset"], function(action){
		$.fn.databind[action] = function(){
			return this.each(function(){ databind(this)[action].apply(this, arguments); });
		};
	});

})(jQuery, databind);