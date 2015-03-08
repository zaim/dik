const $registry = Symbol('registry')

const $resolved = Symbol('resolved')

const $resolving = Symbol('resolving')


/**
 * Dik container class
 */

export default class Dik {

  /**
   * @constructor
   */

  constructor () {
    this[$registry] = {}
    this[$resolved] = {}
    this[$resolving] = {}
  }


  /**
   * Register a resource provider
   *
   * @param {string} id - The unique ID to register the resource as
   * @param {function} fn - The resource provider function
   * @param {object=} options - Options
   * @param {array} options.deps - Array of dependencies (resource ID strings)
   * @returns {Dik} self
   */

  register (id, fn, options) {
    this[$registry][id] = { fn, options }
    return this
  }


  /**
   * Look up a registered resource and its dependencies
   *
   * @param {string} id - The registered resource provider's ID
   * @returns {Promise} - A Promise for the created resource object
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
      return this[$resolved][id]
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
   * @private
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
