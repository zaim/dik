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
    this[$resolving] = {}
    this[$resolved] = {
      $get: (id) => this.get(id)
    }
  }


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

  register (id, fn, options) {
    if (this[$registry][id]) {
      throw new Error(`Resource ${id} already registered`)
    }
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
   * dik.get('bar').then((res) => {
   *   expect(res).toEqual('BAR -> BAZ -> FOO')
   * })
   */

  get (id, _caller) {
    if (id in this[$resolved]) {
      return Promise.resolve(this[$resolved][id])
    }

    if (!this[$registry][id]) {
      return Promise.reject(new Error(`Resource ${id} not registered`))
    }

    if (this[$resolving][id]) {
      _caller = _caller || '?'
      return Promise.reject(
        new Error(`Circular dependency detected: ${_caller} -> ${id}`)
      )
    }

    this[$resolving][id] = true

    const { fn, options } = this[$registry][id]
    const deps = options && options.deps
    const fact = options && options.factory

    const resolveDeps = deps
      ? this.resolveDependencies(deps, id)
      : Promise.resolve()

    return resolveDeps
      .then((deps) => {
        return deps ? fn(...deps) : fn()
      })
      .then((res) => {
        delete this[$resolving][id]
        return fact ? res : (this[$resolved][id] = res)
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
