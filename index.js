"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var $registry = Symbol("registry");

var $resolved = Symbol("resolved");

var $resolving = Symbol("resolving");

/**
 * The Dik container class.
 *
 * @example
 * const dik = new Dik()
 */

var Dik = (function () {
  function Dik() {
    var _this = this;

    _classCallCheck(this, Dik);

    this[$registry] = {};
    this[$resolving] = {};
    this[$resolved] = {
      $get: function (id) {
        return _this.get(id);
      }
    };
  }

  _createClass(Dik, {
    register: {

      /**
       * Register a resource provider
       *
       * The `options` argument can be an options object,
       * which may have these properties:
       *
       * * `deps` - array of resource provider ID strings
       *   that this resource is dependent upon.
       *
       * * `factory` - boolean, if true the resource will
       *   not be cached and a new instance is returned on
       *   every `get` call.
       *
       * As a shortcut, the array of ID strings can also be
       * passed directly as the `options` argument.
       *
       * A special resource id `$get` can be specified to
       * get access to the `Dik#get` method in the resource
       * provider function in order to look-up other resources
       * (see example below)
       *
       * @alias Dik#register
       * @param {string} id The unique ID to register the resource as
       * @param {function} fn The resource provider function
       * @param {object=} options Options object or array of dependency IDs
       * @returns {Dik} self
       *
       * @example
       * // Simple resource provider:
       * dik.register('foo', function () {
       *   return 'FOO'
       * })
       *
       * // Specify dependencies in options object:
       * dik.register('bar', function (baz) {
       *   return 'BAR -> ' + baz
       * }, { deps: ['baz'] })
       *
       * // Specify dependencies in directly:
       * dik.register('bar', function (baz) {
       *   return 'BAR -> ' + baz
       * }, ['baz'])
       *
       * // Lookup other resources:
       * dik.register('baz', function ($get) {
       *   return $get('foo').then((foo) => {
       *     return 'BAZ -> ' + foo
       *   })
       * }, [$get'])
       */

      value: function register(id, fn, options) {
        if (this[$registry][id]) {
          throw new Error("Resource " + id + " already registered");
        }
        if (Array.isArray(options)) {
          options = { deps: options };
        }
        this[$registry][id] = { fn: fn, options: options };
        return this;
      }
    },
    get: {

      /**
       * Look up a registered resource and its dependencies
       *
       * @alias Dik#get
       * @param {string} id The registered resource provider's ID
       * @returns {Promise} A Promise for the created resource object
       *
       * @example
       * dik.get('bar').then((res) => {
       *   expect(res).toEqual('BAR -> BAZ -> FOO')
       * })
       */

      value: function get(id, _caller) {
        var _this = this;

        if (id in this[$resolved]) {
          return Promise.resolve(this[$resolved][id]);
        }

        if (!this[$registry][id]) {
          return Promise.reject(new Error("Resource " + id + " not registered"));
        }

        if (this[$resolving][id]) {
          _caller = _caller || "?";
          return Promise.reject(new Error("Circular dependency detected: " + _caller + " -> " + id));
        }

        this[$resolving][id] = true;

        var _$registry$id = this[$registry][id];
        var fn = _$registry$id.fn;
        var options = _$registry$id.options;

        var deps = options && options.deps;
        var fact = options && options.factory;

        var resolveDeps = deps ? this.resolveDependencies(deps, id) : Promise.resolve();

        return resolveDeps.then(function (deps) {
          return deps ? fn.apply(undefined, _toConsumableArray(deps)) : fn();
        }).then(function (res) {
          delete _this[$resolving][id];
          return fact ? res : _this[$resolved][id] = res;
        });
      }
    },
    resolveDependencies: {

      /**
       * Resolve a sequence of dependencies
       *
       * @access private
       * @alias Dik#resolveDependencies
       * @param {array<string>} deps
       * @param {string} caller
       * @returns {Promise}
       */

      value: function resolveDependencies(deps, caller) {
        var _this = this;

        var res = [];
        var ini = Promise.resolve();
        var seq = deps.reduce(function (acc, id) {
          return acc.then(function () {
            return _this.get(id, caller);
          }).then(function (r) {
            return res.push(r);
          });
        }, ini);
        return seq.then(function () {
          return res;
        });
      }
    }
  });

  return Dik;
})();

module.exports = Dik;

