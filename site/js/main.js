$(document).ready(function(){

	function updateLang() {
		var lang = localStorage.getItem("lang"),
			 pageLang = $("html").attr("lang");
		if(lang === "fr" && pageLang !== "fr"){
			window.location.href = "index_fr.html";
		} else if(lang !== "fr" && pageLang !== "en"){
			window.location.href = "index.html";
		}
	}

	if(localStorage.getItem("lang") === null){
		localStorage.setItem("lang", navigator.language.substr(0,2));
	}
	updateLang();

	$("#lang-button").on("click", function(){
		localStorage.setItem("lang", $(this).data("lang"));
		updateLang();
	});

	$("#menu-button").on("click", function(){
		$(document.body).toggleClass("menu-opened");
	});

	var sections = [],
		$links = $("#menu a");

	$links.each(function(){
		var id = this.getAttribute("href").slice(1);
		sections.push({ id: id, pos: $("#"+id).offset().top+1 });
	});

	function selectLink(id){
		$links.removeClass("active").filter("[href='#"+id+"']").addClass("active");
	}

	$(window).on("hashchange", function(){
		selectLink(location.hash.slice(1));
	});

	$(document).scroll(function(){
		var i,
			delta,
			nearest = { id: sections[0].id, delta: 9999 },
			pos = $(this).scrollTop() + $(window).height() / 4;
		for(i=0; i<sections.length; i++){
			delta = Math.abs(pos - sections[i].pos);
			if(delta < nearest.delta){
				nearest.id = sections[i].id;
				nearest.delta = delta;
			}
		}
		selectLink(nearest.id);
	});


	function updateDemo(){
		var out = document.getElementById("test-zone");
		try {
			delete out.databinding;
			out.innerHTML = document.getElementById("test-html").value;
			eval('databind("#test-zone").set({'+$("#test-js").val() + '});');
		} catch(error){
			$(out).empty().append($("<div class='error'></div>").text(error));
		}
	}

	updateDemo();
	$("#try-yourself").on("change keyup blur", "textarea", updateDemo);

});