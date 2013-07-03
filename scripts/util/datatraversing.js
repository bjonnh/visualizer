
define(['jquery', 'data/structures', 'util/typerenderer'], function($, Structures, TypeRenderer) {

	var asyncId = 0;

	function _getValueFromJPath(element, jpath) {
		var el = getValueIfNeeded(element),
			type,
			jpathElement = jpath.shift();

		if(jpathElement) {
			if(el && (el = el[jpathElement]) !== false) {
				// Fetch the element and return the deferred.
				// However, we pipe the deferred with the recursive function
				return fetchElementIfNeeded(el).pipe(function(elChildren) {
					return _getValueFromJPath(elChildren, jpath);
				});
			} else
				return $.Deferred().reject();
		} else // Finally, jpathElement doesn't exist and we throw what's left
			return $.Deferred().resolve(element);
	}

	function _setValueFromJPath(element, jpath, newValue) {
		var el = getValueIfNeeded(element);
		var type;

		if(typeof el != "object" && jpath.length > 0)
			el = {};
		
		if(jpath.length == 1)
			return el[jpath[0]] = newValue;
		
		var jpathElement = jpath.shift();
		if(jpathElement) {
			if(!(subelement = el[jpathElement])) { // If not an object, we make it an object
				subelement = {};
				el[jpathElement] = subelement;
			}

			// Perhaps the subelement is set only by URL, in which case we have to set it.
			return this.fetchElementIfNeeded(subelement).pipe(function(elChildren) {
				return _setValueFromJPath(elChildren, jpath2, newValue);
			});
		}
	}

	function _valueToScreen(deferred, data, box, args) {
		var type = getType(data),
			highlights = getHighlights(data);

		args = $.extend(args, getOptions(data));
		if(box.view.typeToScreen && box.view.typeToScreen[type])
			return box.view.typeToScreen[type].call(box.view, deferred, data, args, highlights, box);
		TypeRenderer.toScreen(deferred, data, args, highlights, box);
	}

	function getOptions(value) {
		return value._options || {};
	}

	function getHighlights(value) {
		return value._highlight || [];
	}

	function getValueIfNeeded(element) {
		if(typeof element == "undefined")
			return;

		if(typeof element == "object" && (element.value || element.url))
			return this.fetchElementIfNeeded(element);

		return element;
	}

	function fetchElementIfNeeded(element) {
		var deferred = $.Deferred();
		
		if(typeof element == "undefined" || element == null)
			return deferred.reject();
		var type = getType(element);
		if(element.url) {
console.log(element.url);
			//var ajaxType = typeof Structures[type] == "object" ? 'json' : 'text';
			require(['util/urldata'], function(urlData) {
				console.log(urlData);
				urlData.get(element.url, false, element.timeout).then(function(data) {
					console.log(data);
					deferred.resolve(data);
				}, function(data) {
					console.log('Fetching error');
				});
			});
			return deferred;
		} else if(element.value) {
			return deferred.resolve(element.value);
		} else
			return deferred.resolve(element);
	}

	function getType(element) {
		if(element == undefined)
			return;
		var type = typeof element;
		if(type == 'object') {
			if(element instanceof Array)
				return "array";
			if(typeof element.type == "undefined")
				return "object";
			else if(Structures[element.type])
				return element.type;
			else {
				console.error("Type " + element.type + " could not be found");
				return;
			}
		}
		// Native types: int, string, boolean
		return type;
	}

	return {

		getType: getType,

		getValueIfNeeded: getValueIfNeeded,
		fetchElementIfNeeded: fetchElementIfNeeded,

		getValueFromJPath: function(element, jpath) {
			if(!jpath)
				return element;
			if(!jpath.split)
				jpath = '';

			var jpathSplitted = jpath.split('.'); // Remove first element, which should always be "element"
			jpathSplitted.shift();

			return _getValueFromJPath(element, jpathSplitted)
		},

		setValueFromJPath: function(element, jpath, newValue) {
			if(!jpath.split)
				jpath = '';

			var jpathSplitted = jpath.split('.').shift();
			return _setValueFromJPath(element, jpathSplitted, newValue);
		},

		getJPathsFromStructure: function(structure, title, jpathspool, keystr) {		 
		 	if(!structure)
				return;
			var children = [];
			if(structure.elements) {
				if(!keystr || keystr == null) {
					keystr = "element";
					title = keystr;
				} else
					keystr = keystr + "." + title;
				jpathspool.push({ title: title, children: children, key: keystr });
				switch(structure.type) {
					case 'object':
						for(var i in structure.elements)
							this.getJPathsFromStructure(structure.elements[i], i + "", children, keystr);
					break;
					case 'array':
						// Array which length is nown
						if(!(structure.elements instanceof Array))
							structure.elements = [structure.elements];
						var len = Math.min(5, structure.elements.length);
						if(structure.nbElements)
							len = structure.nbElements;
						for(var i = 0; i < len; i++) {
							this.getJPathsFromStructure(structure.elements[i] || structure.elements[0], i + "", children, keystr);
						}
					break;
				}		
			} else {
				if(typeof Structures[structure] == "object")
					this.getJPathsFromStructure(Structures[structure], title, jpathspool, keystr);
				else {
					if(!keystr || keystr == null) {
						keystr = "element";
						title = keystr;
					} else
						keystr = keystr + "." + title;
					jpathspool.push({ title: title, children: children, key: keystr });
				}
			}
		},


		getStructureFromElement: function(element) {
			
			var structure = {};
			var el = element;
			if(element === undefined || element === null)
				return;
				
			if(element.type)
				element = element.value;
			
			if(el !== false && el.type && Structures[el.type]) {
				structure = Structures[el.type];
			} else if(element instanceof Array) {
				structure.type = "array";
				structure.elements = [];
				var length = Math.min(5, element.length);
				for(var i = 0; i < length; i++) {
					var elementI = element[i];	
					structure.elements[i] = this.getStructureFromElement(elementI);
				}
			} else if(typeof element == "object") {
				structure.type = "object";	
				structure.elements = {};
				for(var i in element) 
					structure.elements[i] = this.getStructureFromElement(element[i]);
			} else if(el.type)
				structure = el.type;
			else
				return typeof el;
			return structure;
		},

		getJPathsFromElement: function(element, jpaths) {
			if(!jpaths)
				var jpaths = [];
			jpaths.push({title: 'Not set', key: ''});
			if(element === undefined || element == null)
				return;
			// We know the dynamic structure
			// Apply to typed elements + to js objects
			if(element.structure)
				this.getJPathsFromStructure(element.structure, null, jpaths);	
			else if(element.type && Structures[element.type])
				this.getJPathsFromStructure(Structures[element.type], null, jpaths);
			else {
				switch(typeof element) {
					default:
					case 'object':
						var structure = this.getStructureFromElement(element, structure);
						this.getJPathsFromStructure(structure, null, jpaths);
					break;
				}
			}
		},

		toScreen: function(element, box, opts) {
			var slice = Array.prototype.slice;
			var deferred = $.Deferred();
			this.fetchElementIfNeeded(element).done(function(data) { 
				_valueToScreen(deferred, data, box, opts); 
			});
			return deferred.promise();
		}

	}
});

/*

CI.DataType.asyncToScreenAttribute = function(source, attribute, jpath, element) {
		
	var def = $.Deferred();
	var _class = "callback-load-attr-";
	_class += ++CI.DataType.asyncId;
	
	var def = CI.DataType.getValueFromJPath(source, jpath).done(function(value) {

			if(attribute == 'style.backgroundColor') {
				$("." + _class).css('background-color', value);
			} else {
				if(element)
					element.attr(attribute, value);
				else
					$("." + _class).attr(attribute, value);
			}
		});

	def._class = _class;
	if(source.type && !source.value && source.url) {
		return def;
	} else
		return def;
}


CI.DataType.asyncToScreenHtml = function(element, box, jpath) {
	var asyncId = 'callback-load-' + (++CI.DataType.asyncId);
	var html = "";
		html += '<span id="';
		html += asyncId;
		html += '" class="loading">Loading...</span>';
	var def = CI.DataType.getValueFromJPath(element, jpath).pipe(function(data) { var el = CI.DataType._toScreen(data, box).done(function(el) { $("#" + asyncId).html(el); CI.Util.ResolveDOMDeferred($("#" + asyncId)); }); return el; });
	def.html = html;
	def.id = asyncId;
	return def; 	
}

*/
