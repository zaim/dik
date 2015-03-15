"use strict";

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
    _classCallCheck(this, Dik);

    this[$registry] = {};
    this[$resolved] = {};
    this[$resolving] = {};
  }

  _createClass(Dik, {
    register: {

      /**
       * Register a resource provider
       *
       * The `options` argument can be an options object,
       * which can have a `deps` property which is an
       * array of resource provider ID strings that this
       * resource is dependant upon.
       *
       * As a shortcut, the array of ID strings can also be
       * passed directly as the `options` argument.
       *
       * @alias Dik#register
       * @param {string} id The unique ID to register the resource as
       * @param {function} fn The resource provider function
       * @param {object=} options Options object or array of dependency IDs
       * @returns {Dik} self
       *
       * @example
       * // Simple resource provider.
       * dik.register('foo', function () {
       *   return 'FOO'
       * })
       *
       * // Lookup other resources.
       * dik.register('bar', function () {
       *   return this.get('foo').then((foo) => {
       *     return 'BAR -> ' + foo
       *   })
       * })
       *
       * // Specify dependencies in options object.
       * dik.register('baz', function (bar) {
       *   return 'BAZ -> ' + bar
       * }, { deps: ['bar'] })
       *
       * // Specify dependencies in directly.
       * dik.register('baz', function (bar) {
       *   return 'BAZ -> ' + bar
       * }, ['bar'])
       */

      value: function register(id, fn, options) {
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
       * dik.get('baz').then((res) => {
       *   expect(res).toEqual('BAZ -> BAR -> FOO')
       * })
       */

      value: function get(id, _caller) {
        var _this = this;

        if (!this[$registry][id]) {
          return Promise.reject(new Error("Resource " + id + " not registered"));
        }

        if (this[$resolving][id]) {
          _caller = _caller || "?";
          return Promise.reject(new Error("Circular dependency detected: " + _caller + " -> " + id));
        }

        if (id in this[$resolved]) {
          return Promise.resolve(this[$resolved][id]);
        }

        this[$resolving][id] = true;

        var _$registry$id = this[$registry][id];
        var fn = _$registry$id.fn;
        var options = _$registry$id.options;

        var resolveDeps = options && options.deps ? this.resolveDependencies(options.deps, id) : Promise.resolve();

        return resolveDeps.then(function (deps) {
          return deps && deps.length ? fn.apply(_this, deps) : fn.call(_this);
        }).then(function (res) {
          delete _this[$resolving][id];
          return _this[$resolved][id] = res;
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

