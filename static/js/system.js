var AWAD = {
	Observatory: $({})
};

// Расширяем объект массива
$A = Array.from = function(iterable) {
	if (!iterable) {
		return [];
	}
	if (iterable.toArray) {
		return iterable.toArray();
	} else {
		var results = [];
		for (var i = 0, length = iterable.length; i < length; i++) {
			results.push(iterable[i]);
		}
		return results;
	}
};

// Расширяем прототип функции для добавления передачи контекста через .bind()
$.extend( Function.prototype, {
	bind: function() {
		var __method = this, args = $A(arguments), object = args.shift();
		return function() {
			return __method.apply(object, args.concat($A(arguments)));
		};
	}
});