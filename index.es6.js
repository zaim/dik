const $registry = Symbol('registry')

const $resolved = Symbol('resolved')

const $resolving = Symbol('resolving')


/**
 * The Dik container class.
 *
 * @example
 * const dik = new Dik()
 */

export default class Dik {

  constructor () {
    this[$registry] = {}
    this[$resolved] = {}
    this[$resolving] = {}
  }


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

  register (id, fn, options) {
    if (Array.isArray(options)) {
      options = { deps: options }
    }
    this[$registry][id] = { fn, options }
    return this
  }


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

  get (id, _caller) {
    if (!this[$registry][id]) {
      return Promise.reject(new Error(`Resource ${id} not registered`))
    }

    if (this[$resolving][id]) {
      _caller = _caller || '?'
      return Promise.reject(
        new Error(`Circular dependency detected: ${_caller} -> ${id}`)
      )
    }

    if (id in this[$resolved]) {
      return Promise.resolve(this[$resolved][id])
    }

    this[$resolving][id] = true

    const { fn, options } = this[$registry][id]

    const resolveDeps = options && options.deps
      ? this.resolveDependencies(options.deps, id)
      : Promise.resolve()

    return resolveDeps
      .then((deps) => {
        return deps && deps.length ? fn.apply(this, deps) : fn.call(this)
      })
      .then((res) => {
        delete this[$resolving][id]
        return (this[$resolved][id] = res)
      })
  }


  /**
   * Resolve a sequence of dependencies
   *
   * @access private
   * @alias Dik#resolveDependencies
   * @param {array<string>} deps
   * @param {string} caller
   * @returns {Promise}
   */

  resolveDependencies (deps, caller) {
    const res = []
    const ini = Promise.resolve()
    const seq = deps.reduce((acc, id) => {
      return acc
        .then(() => this.get(id, caller))
        .then((r) => res.push(r))
    },ini)
    return seq.then(() => res)
  }

}
