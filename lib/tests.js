exports.k = function (konstant) {
	return function () {
		return konstant;
	};
};

exports.merge = function (a, b) {
	a = a || {};

	return Object.keys(b).reduce(function (target, key) {
		var val = b[key];
		if (!val || val instanceof Date || typeof val !== 'object') {
			target[key] = val;
		} else {
			target[key] = target[key] && typeof target[key] === 'object' ?
				target[key] : {};
			target[key] = exports.merge(target[key], val);
		}
		return target;
	}, a);
};

exports.deepFreeze = function (x) {
	if (x && typeof x === 'object') {
		Object.keys(x).forEach(function (key) {
			exports.deepFreeze(x[key]);
		});
		return Object.freeze(x);
	}

	return x;
};

exports.clone = function (x) {
	return JSON.parse(JSON.stringify(x));
};

exports.defaultObject = exports.deepFreeze({
	aNumber: -1,
	aString: 'some string',
	emptyString: '',
	aFloat: 0.1,
	aBoolean: false,
	aNull: null,
	aDate: new Date('June 4, 2012 10:06:30 GMT-0500'),
	aFunction: function aFunction() {}
	anArray: [1,2,3],
	anObject: {foo: 'bar'},
	aNestedArray: [null, {baz: 'zee'}, ['one','two','three']],
	aNestedObject: {
		aDate: new Date('June 4, 2012 10:06:30 GMT-0500'),
		anArray: [1,2,3],
		anObject: {foo: 'bar'},
		aFunction: function anotherFunction() {}
	}
});

exports.tests = {
	create: function (API) {
		var original = exports.deepFreeze(exports.merge({
			id: 'abc-123',
			type: 'genus',
			name: 'Panthera'
		}, defaultObject));

		function clean() {
			return API.remove(original.type, original.id);
		}

		function createOriginal() {
			return API.create(original);
		}

		function testOriginalResponse(res) {
			var diff = whyNotEqual(original, res);
			if (diff) {
				var msg = 'The result of .create() should be conceptually equal to ' +
					'the original source Object: ' + diff;
				return Promise.reject(new AssertionError(msg));
			}
		}

		function testRejectedRecreate(err) {
			if (err instanceof ShouldNotBeCalledError) {
				return Promise.reject(err);
			}

			if (!(err instanceof Error)) {
				var msg = 'Rejected errors must be Error objects (in attemptRecreate)';
				return Promise.reject(new AssertionError(msg));
			}
		}

		function attemptLoad() {
			return API.get(original.type, original.id);
		}

		function testLoad(res) {
			var diff = whyNotEqual(original, res);
			if (diff) {
				var msg = 'The result of .get() should be conceptually equal to ' +
					'the original source Object: ' + diff;
				return Promise.reject(new AssertionError(msg));
			}
		}

		return clean()
			.then(createOriginal)
			.then(testOriginalResponse)
			.then(createOriginal)
			.then(function () {
				var error = new ShouldNotBeCalledError(
					'Attempting to re-create an entity that already exists should ' +
					'return a rejected Promise. Therefore, the .catch() handler should ' +
					'be called instead of the .then() handler.'
				);
				return Promise.reject(error);
			})
			.catch(testRejectedRecreate)
			.then(attemptLoad)
			.then(testLoad)
			.then(exports.k(true));
	},

	update: function (API) {
		var original = exports.deepFreeze(exports.merge({
			id: 'def-456',
			type: 'family',
			name: 'Leo'
		}, defaultObject));

		var next = exports.deepFreeze({
			id: 'def-456',
			type: 'family',
			name: 'Leo',
			aString: 'some other string'
		});

		function clean() {
			return API.remove(original.type, original.id);
		}

		function attemptUpdate() {
			return API.update(next);
		}

		function testRejectedRecreate(err) {
			if (err instanceof ShouldNotBeCalledError) {
				return Promise.reject(err);
			}

			if (!(err instanceof Error)) {
				var msg = 'Rejected errors must be Error objects (in attemptRecreate)';
				return Promise.reject(new AssertionError(msg));
			}
		}

		function createOriginal() {
			return API.create(original);
		}

		function testUpdateResponse(res) {
			var diff = whyNotEqual(original, res);
			if (diff) {
				var msg = 'The result of .update() should be conceptually equal to ' +
					'the original source Object: ' + diff;
				return Promise.reject(new AssertionError(msg));
			}
		}

		function attemptLoad() {
			return API.get(next.type, next.id);
		}

		function testLoad(res) {
			var diff = whyNotEqual(next, res);
			if (diff) {
				var msg = 'The result of .get() should be conceptually equal to ' +
					'the updated Object: ' + diff;
				return Promise.reject(new AssertionError(msg));
			}
		}

		return clean()
			.then(attemptUpdate)
			.then(function () {
				var error = new ShouldNotBeCalledError(
					'Attempting to update an entity that does not exist should ' +
					'return a rejected Promise. Therefore, the .catch() handler ' +
					'should be called instead of the .then() handler.'
				);
				return Promise.reject(error);
			})
			.catch(testRejectedUpdate)
			.then(createOriginal)
			.then(attemptUpdate)
			.then(testUpdateResponse)
			.then(attemptLoad)
			.then(testLoad)
			.then(exports.k(true));
	}
};
