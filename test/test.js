(function(global){

	function detectGlobals(endFn){

		function getIFrame(url, callback) {
			var elIframe = document.createElement('iframe');
			elIframe.style.display = 'none';
			document.body.appendChild(elIframe);
			elIframe.src = url || 'about:blank';
			elIframe.onload = function(){
				callback(elIframe.contentWindow || elIframe.contentDocument);
			};
		}

		getIFrame("iframe-empty.html", function(ref){
			getIFrame("iframe-lib.html", function(frame){
				var differences = {},
					exceptions = ''.split(','),
					i;

				for (i in frame) {
					if(i in ref === false){
						differences[i] = {
							'type': typeof window[i],
							'val': window[i]
						}
					}
				}

				i = exceptions.length;
				while (--i) {
					delete differences[exceptions[i]]
				}

				endFn(differences);
			});
		});

	}

	asyncTest("library loading", function(){
		detectGlobals(function(newGlobals){
			ok("databind" in global);
			equal(Object.keys(newGlobals).length, 1);
			equal(Object.keys(newGlobals)[0], "databind");
			start();
		});
	});

	var test1 = document.getElementById("test1");
	databind(test1).set({
		label:   "My website",
		url:     "http://syllab.fr/",
		tooltip: "syllab.fr",
		embed: {
			scope: {
				value: "ok"
			}
		}
	});

	test("binding attributes", function(){
		var a = test1.querySelector('a');
		equal(a.textContent, "My website");
		equal(a.href, "http://syllab.fr/");
		equal(a.getAttribute("title"), "syllab.fr");
		equal(test1.querySelector("p").innerHTML, "ok");
	});

	var test2 = document.querySelector("#test2");

	test("binding loop array", function(){

		databind(test2.querySelector("ul")).set({
			emptylist: ["", undefined]
		});

		equal(test2.getElementsByTagName("ul").length, 1);
		equal(test2.getElementsByTagName("li").length, 2);

		databind(test2.querySelector("ul")).set({
			emptylist: []
		});

		equal(test2.getElementsByTagName("ul").length, 0);
		equal(test2.getElementsByTagName("li").length, 0);

		databind("table.tictactoe").set({
			grid: [  ["X", " ", "O" ],
						["O", "X", " " ],
						[" ", " ", "X" ] ]
		});

		equal(test2.getElementsByTagName("tr").length, 3);
		equal(test2.getElementsByTagName("td").length, 9);
		ok(test2.getElementsByTagName("tbody").length < 2);
		ok([].every.call(test2.getElementsByTagName("td"), function(td){
			return td.innerHTML.length===1;
		}));
		equal([].map.call(test2.getElementsByTagName("td"), function(td){
			return td.innerHTML;
		}).join(''),"X OOX   X");
	});

	var test3 = document.getElementById("palette");
	databind("#palette").set({
		palette: {
			"Light Blue": "#ADD8E6",
			"Chocolate": "#D2691E",
			"Olive": "#808000",
			"Salmon": "#FA8072",
			"Indigo": "#4B0082"
		},
		favorites: [ "Chocolate", "Olive", "Salmon" ],
		getColorValue: function(data){
			return data.palette[this.color];
		}
	});

	test("traversing properties and indexes", function(){
		equal(test3.querySelectorAll("ol li").length, 3);
		equal(test3.querySelectorAll("ul li").length, 5);
		equal(test3.querySelectorAll("ul li")[1].innerHTML, "Chocolate");
		equal(test3.querySelectorAll("ol li b")[2].innerHTML, "2");

		var a = document.createElement('a');
		a.style.color = "#808000";
		a.style.backgroundColor = "#FA8072";
		equal(test3.querySelectorAll("ul li")[2].style.color, a.style.color);
		equal(test3.querySelectorAll("ol li")[2].style.backgroundColor, a.style.backgroundColor);
	});

	var test4 = document.getElementById("test4");
	databind('#test4 input').set({
		properties: {
			blue: false,
			red: true
		}
	});
	databind('#test4 button').set({
		classNames: "some classes as string"
	});
	databind('#test4 section').set({
		otherClasses: ["some", "other", "classes"]
	});
	databind('#test4 p.stuff').set({
		message: "This is important stuff dude !",
		isImportant: true,
		isBusiness: false
	});

	test("class binding", function(){
		equal(test4.querySelector("input").className, "red");
		equal(test4.querySelector("button").className, "some classes as string");
		var classes = test4.querySelector("section").className.split(' ').sort();
		equal(classes.length, 3);
		equal(classes.join(' '),"classes other some");

		classes = test4.querySelector("p").className.split(' ').sort();
		equal(classes.length, 2);
		equal(classes.join(' '), "important stuff");
	});

	var test5 = document.querySelector("#test5");

	test("if binding", function(){
		databind(test5).set({
			bool: false,
			arr: [1,2,3,4,5],
			showOrHide: function(){
				return this.loopValue % 2 == 1;
			},
			lvl1: false,
			lvl2: true,
			lvl3: false
		});
		equal(test5.querySelectorAll("section").length, 0);
		equal(test5.querySelectorAll("div").length, 0);
		equal(test5.querySelectorAll("li").length, 3);
		equal(test5.children.length, 2);

		databind(test5).set({
			bool: true,
			arr: [1,2,3,4,5,6,7,8,9,10],
			showOrHide: function(){
				return this.loopValue % 2 == 0;
			},
			lvl1: true,
			lvl2: false,
			lvl3: true
		});
		equal(test5.querySelectorAll("section").length, 1);
		equal(test5.querySelectorAll("div").length, 1);
		equal(test5.querySelectorAll("li").length, 5);
		equal(test5.children.length, 4);
	});

	var test6 = document.querySelector("#test6");
	databind(test6).set({
		items: ["Some", "items", "seem", "to", "have", "disappeared"],
		autocensor: function(){
			return this.loopIndex % 2 === 0;
		}
	});

	test("visible binding", function(){
		var oli = [].slice.call(test6.querySelectorAll("ol li"));
		equal(oli.length, 6);
		oli = oli.filter(function(li){
			return li.style.display !== "none";
		});
		equal(oli.length, 3);
		equal(oli.map(function(li){
			return li.innerHTML;
		}).join(' '),"items to disappeared");

		var uli = [].slice.call(test6.querySelectorAll("ul li"));
		equal(uli.length, 6);
		uli = uli.filter(function(li){
			return li.style.display !== "none";
		});
		equal(uli.length, 3);
		equal(uli.map(function(li){
			return li.innerHTML;
		}).join(' '),"Some seem have");
	});

	var test7 = document.getElementById("test7");

	test("functions and generators", function(){
		databind("#test7").set({
			suite: [],
			suiteGenerator: function(scope){
				var n = scope.suite.length;
				scope.suite[n] = n<2 ? 1 : scope.suite[n-2] + scope.suite[n-1];
				return scope.suite[n] < 100 ? scope.suite[n] : null;
			},
			isPrime: function(){
				for(var n=2; n<= ~~(this.number/2); n++){
					if ( this.number % n === 0 ){
						return false;
					}
				}
				return true;
			}
		});

		equal(test7.querySelectorAll("span").length, 11);
		equal(test7.querySelectorAll("span.prime").length, 7);
		equal([].map.call(test7.querySelectorAll("span"), function(i){
			return i.innerHTML;
		}).join('-'),"1-1-2-3-5-8-13-21-34-55-89");
		equal([].map.call(test7.querySelectorAll("span.prime"), function(i){
			return i.innerHTML;
		}).join('-'),"1-1-2-3-5-13-89");
	});

	var test8 = document.getElementById("test8");

	test("style binding", function(){
		databind(test8.querySelector('input')).set({
			otherRules: {
				borderWidth: "10px",
				borderColor: "red"
			}
		});
		databind(test8.querySelector('button')).set({
			ruleSet: "text-transform: uppercase; font-weight: bold;"
		});
		databind(test8.querySelector('p')).set({
			message: "Big red stuff !",
			color: "rgb(255,0,0)",
			size: "3em"
		});

		var testElem = document.createElement("p");
		testElem.style.backgroundColor = "lime";
		testElem.style.borderColor = "red";
		testElem.style.color = "rgb(255,0,0)";

		equal(test8.querySelector("input").style.backgroundColor, testElem.style.backgroundColor);
		equal(test8.querySelector("input").style.borderWidth, "10px");
		equal(test8.querySelector("input").style.borderColor, testElem.style.borderColor);
		equal(test8.querySelector("button").style.textTransform, "uppercase");
		equal(test8.querySelector("button").style.fontWeight, "bold");
		equal(test8.querySelector("button").style.fontWeight, "bold");
		equal(test8.querySelector("p").innerHTML, "Big red stuff !");
		equal(test8.querySelector("p").style.color, testElem.style.color);
		equal(test8.querySelector("p").style.fontSize, "3em");

	});

	var test9 = document.getElementById("test9");
	test("with binding", function(){

		databind('#test9').set({
			name: "Karl",
			child : {
				name: "Karl Junior",
				child: {
					name: "Baby Karl"
				}
			}
		});

		var spans, pars, p;
		pars = test9.getElementsByTagName("p");
		for(p=0; p < pars.length; p++){
			spans = pars[p].getElementsByTagName("span");
			equal(spans.length, 3);
			equal(spans[0].innerHTML, "Karl");
			equal(spans[1].innerHTML, "Karl Junior");
			equal(spans[2].innerHTML, "Baby Karl");
		}
	});

	var test10 = document.getElementById("test10");
	test("checked and selected bindings", function(){

		databind(test10).set({
			understood: true,
			answers: [
				{ text: "Easy as pie", default: false },
				{ text: "It's all right", default: true },
				{ text: "I need coffee !", default: false }
			]
		});

		ok(test10.querySelector("input").checked === true);
		equal(test10.getElementsByTagName("option").length, 3);
		equal(test10.querySelector("select").value, "1");
		equal(test10.querySelectorAll("option")[0].selected, false);
		equal(test10.querySelectorAll("option")[1].selected, true);
		equal(test10.querySelectorAll("option")[0].selected, false);

	});

	var test11 = document.getElementById("test11");

	function fireClick(node){
		if ( document.createEvent ) {
			var evt = document.createEvent('MouseEvents');
			evt.initEvent('click', true, false);
			node.dispatchEvent(evt);
		}
	}

	test("events binding", function(){

		var List = function(selector){
			this.itemCounter = 0;
			this.itemCollection = [];
			this.databinding = databind(selector).set(this);
		};

		List.prototype = {
			addItem: function(){
				this.itemCollection.push({
					num: ++this.itemCounter
				});
				this.databinding.reset();
			},
			remove: function(event, list){
				event.preventDefault();
				list.itemCollection.splice(list.itemCollection.indexOf(this.loopValue), 1);
				list.databinding.reset();
			}
		};

		var myList = new List("#mylist");
		myList.addItem();
		myList.addItem();
		myList.addItem();

		equal(test11.querySelectorAll("li").length, 3);

		fireClick(test11.querySelectorAll("li a")[1]);

		equal(test11.querySelectorAll("li").length, 2);
		equal(myList.itemCollection.length, 2);
		equal(myList.itemCollection[0].num, 1);
		equal(myList.itemCollection[1].num, 3);

		fireClick(test11.querySelector("input"));
		fireClick(test11.querySelector("input"));

		equal(test11.querySelectorAll("li").length, 4);
		equal(myList.itemCollection.length, 4);
		equal(myList.itemCollection[2].num, 4);

	});

	var test12 = document.getElementById("test12");

	function fireMouseEvent(node, type){
		if ( document.createEvent ) {
			var evt = document.createEvent('MouseEvents');
			evt.initMouseEvent(type, true, false, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
			node.dispatchEvent(evt);
		}
	}

	test("advanced event binding and custom events", function(){
		var rectanglesCounter = 0;
		databind(test12).set({
			rects: [],
			currentRect: null,
			start: function(e, scope, elm) {
				this.currentRect = {
					x: e.offsetX,
					y: e.offsetY,
					w: 1,
					h: 1
				};
				this.rects.push(this.currentRect);
				databind(elm).reset();
			},
			end: function(e){
				this.currentRect = null;
				var event = document.createEvent("CustomEvent");
				event.initCustomEvent('rectangle', false, false, null);
				test12.querySelector("svg").dispatchEvent(event);
			},
			update: function(e, scope, elm) {
				if(scope.currentRect != null){
					scope.currentRect.w = Math.max(1, e.offsetX - scope.currentRect.x);
					scope.currentRect.h = Math.max(1, e.offsetY - scope.currentRect.y);
					databind(elm).reset();
				}
			},
			customEventHandler: function() {
				rectanglesCounter++;
			}
		});

		var svg = test12.querySelector("svg");
		fireMouseEvent(svg, "mousedown");
		fireMouseEvent(svg, "mousemove");
		fireMouseEvent(svg, "mouseup");
		equal(rectanglesCounter, 1);
	});

	var test13 = document.getElementById("test13");
	test("complex bindings value paths", function(){

		databind(test13).set({
			name: "a",
			child : {
				name: "b",
				child: {
					name: "c"
				}
			}
		});

		var spanValues = [].map.call(test13.getElementsByTagName("span"), function(span){
			return span.innerHTML;
		}).join('');

		equal(spanValues, "aaabbbbccccc");

	});

	var test14 = document.getElementById("test14");
	test("text and html bindings", function(){
		databind(test14).set({
			msg: "try to <strong>inject</strong> <iframe></iframe> html <span>stuff</span>"
		});
		equal(test14.querySelector(".text").children.length, 0);
		equal(test14.querySelector(".text iframe"), null);
		equal(test14.querySelector(".text span"), null);
		equal(test14.querySelector(".html").children.length, 3);
		notEqual(test14.querySelector(".html iframe"), null);
		notEqual(test14.querySelector(".html span"), null);
		ok([].every.call(test14.querySelectorAll(".undefined"), function(elm){
			return elm.innerHTML === "do not touch";
		}));
	});

	var test15 = document.getElementById("test15");
	test("template binding", function(){
		databind(test15).set({
			africa: [
				{ country:"Senegal", capital:"Dakar", img:"../site/res/flags/sn.png" },
				{ country:"Namibia", capital:"Windhoek", img:"../site/res/flags/na.png" },
				{ country:"Egypt", capital:"Cairo", img:"../site/res/flags/eg.png" }
			],
			asia: [
				{ country:"Russia", capital:"Moscow", img:"../site/res/flags/ru.png" },
				{ country:"Israel", capital:"Jerusalem", img:"../site/res/flags/il.png" },
				{ country:"Japan", capital:"Tokyo", img:"../site/res/flags/jp.png" }
			],
			europe: [
				{ country:"France", capital:"Paris", img:"../site/res/flags/fr.png" },
				{ country:"Sweden", capital:"Stockholm", img:"../site/res/flags/se.png" },
				{ country:"Germany", capital:"Berlin", img:"../site/res/flags/de.png" }
			]
		});

		equal(test15.querySelectorAll("#flags img").length, 9);
		equal(test15.querySelectorAll("#flags h3").length, 9);
		equal(test15.querySelectorAll("#flags dd").length, 9);
		equal(test15.querySelectorAll("#flags h2")[2].innerHTML, "Africa");
		equal([].map.call(test15.querySelectorAll("#flags h3"), function(country){
			return country.innerHTML;
		}).join(","), "France,Sweden,Germany,Russia,Israel,Japan,Senegal,Namibia,Egypt");

	});


	databind.extensions.equals = function(x){
		return this == x;
	};
	databind.extensions.none = function(fn){
		return this === null || this === undefined || this.length === 0
			|| (fn !== undefined	&& Array.isArray(this) && !this.some(fn));
	};
	databind.extensions.moreThan = function(n){
		return (Array.isArray(this) ? this.length : +this) > n;
	};
	databind.extensions.between = function(start, end){
		var n = (Array.isArray(this) ? this.length : +this);
		return n >= start && n <= end;
	};
	databind.extensions.every = function(f){
		return Array.isArray(this) && this.every(typeof f == "function" ? f : function(){ return this[f] });
	};
	databind.extensions.some = function(f){
		return Array.isArray(this) && this.some(typeof f == "function" ? f : function(){ return this[f] });
	};
	databind.extensions.sort = function(f){
		return Array.isArray(this) ? this.sort(f) : [];
	};
	databind.extensions.filter = function(f){
		return Array.isArray(this) ? this.filter(f) : [];
	};
	databind.extensions.date = function(){
		return new Date(this).toLocaleDateString();
	};
	databind.extensions.time = function(){
		return new Date(this).toLocaleTimeString()
	};
	databind.extensions.floor = function(n){
		var f = Math.pow(10, n|0);
		return Math.floor( f * (+this) ) / f;
	};
	databind.extensions.ceil = function(n){
		var f = Math.pow(10, n|0);
		return Math.ceil( f * (+this) ) / f;
	};
	databind.extensions.round = function(n){
		var f = Math.pow(10, n|0);
		return Math.round( f * (+this) ) / f;
	};
	databind.extensions.trim = String.prototype.trim;
	databind.extensions.lowercase = String.prototype.toLowerCase;
	databind.extensions.uppercase = String.prototype.toUpperCase;
	databind.extensions.capitalize = function(){
		return String(this).charAt(0).toUpperCase() + String(this).slice(1);
	};

	databind.extensions.year = function(){
		return new Date(this).getFullYear();
	};

	var test16 = document.getElementById("test16");

	test("extensions", function(){
		databind(test16).set({
			arr: [1,2,3],
			num: 1234.567,
			date: 2012.345
		});
		equal(test16.querySelector("p").innerHTML, "1235");
		equal(test16.querySelector("span").innerHTML, "2012");
	});

	var test17 = document.getElementById("test17");
	test("automatic bindings", function(){
		var span1 = document.createElement("span");
		var span2 = document.createElement("span");
		var span3 = document.createElement("span");
		span1.innerHTML="1";
		span2.innerHTML="2";
		span3.innerHTML="3";
		databind(test17).set({
			wrapper: {
				list: [
					{ htmlcontent: span1 },
					{ htmlcontent: span2 },
					{ htmlcontent: span3 }
				],
				selectLast: function(scope, elm){
					elm.innerHTML = this.loopIndex;
					return this.loopValue === scope.wrapper.list[2];
				},
				truthy: true,
				falsy: false,
				imgurl:"../site/res/flags/fr.png",
				helloworld: "Hello world !"
			}
		});
		equal(test17.querySelectorAll("li").length, 3);
		equal(test17.querySelectorAll("span").length, 3);
		equal(test17.querySelectorAll("span")[2].innerHTML, "3");
		equal(test17.querySelectorAll("option").length, 3);
		ok(test17.querySelectorAll("option")[2].selected);
		ok(test17.querySelector("[name='truthy']").checked);
		equal(test17.querySelector("#falsy"), null);
		equal(test17.querySelector("figure"), null);
		equal(test17.querySelector("img").getAttribute("src"), "../site/res/flags/fr.png");
		equal(test17.querySelector("input[name='helloworld']").value, "Hello world !");
		equal(test17.querySelector("p").textContent, "Hello world !");
	});


	var test18 = document.getElementById("test18");
	test("view saves with get", function() {

		function save(){
			databind(test18.querySelector("form")).get();
			databind(test18.querySelector("p")).reset();
		}

		databind(test18).set({
			scores: [
				{ name: "Joe", score: 6500 },
				{ name: "Jack", score: 8200 },
				{ name: "Jim", score: 5750 }
			],
			winner: function () {
				return this.scores.reduce(function (a, b) {
					return a.score > b.score ? a : b;
				});
			},
			save: function (event) {
				event.preventDefault();
				save();
			}
		});

		equal(test18.querySelectorAll("span")[0].textContent, "Jack");
		equal(test18.querySelectorAll("span")[1].textContent, "8200");
		test18.querySelectorAll("input")[2].value = "Jeff";
		save();
		equal(test18.querySelectorAll("span")[0].textContent, "Jeff");
		test18.querySelectorAll("input")[3].value = 5000;
		save();
		equal(test18.querySelectorAll("span")[0].textContent, "Joe");
		equal(test18.querySelectorAll("span")[1].textContent, "6500");
	});

	var test19 = document.getElementById("test19");
	test("string and number parameters", function() {
		databind(test19).set();
		equal(test19.querySelectorAll("span").length, 0);
		equal(test19.querySelector("p").innerHTML, "test string parameter");
	});

})(this);
