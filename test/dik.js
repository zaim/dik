/* jshint mocha:true */

import debug from 'debug'
import expect from 'expect'
import Dik from '../index.es6'

debug = debug('dik')


describe('dik', function () {

  let dik

  beforeEach(function () {
    dik = new Dik()
  })


  describe('register()', function () {

    it('should return self', function (done) {
      const ret = dik.register('foo', () => 'FOO')
      expect(ret).toBe(dik)
      done()
    })

    it('should throw error when id already exist', function (done) {
      dik.register('foo', () => 'FOO')
      expect(() => dik.register('foo', () => 'FOO2')).toThrow(/foo/)
      done()
    })

  })


  describe('get()', function() {

    it('should return a Promise for the resource', function (done) {
      const foo = () => 'FOO'
      dik.register('foo', foo)
      dik.get('foo').then((r) => {
        expect(r).toBe('FOO')
        done()
      })
    })


    it('should throw if resource not registered', function (done) {
      dik.get('foo').catch((err) => {
        expect(err.toString()).toMatch(/foo/)
        done()
      })
    })


    it('should throw if circular lookup is detected', function (done) {
      const foo = function () {}
      const bar = function () {}
      const baz = function (get) {
        return get('foo')
      }
      dik.register('foo', foo, { deps: ['bar'] })
      dik.register('bar', bar, { deps: ['baz'] })
      dik.register('baz', baz, { deps: ['$get'] })
      dik.get('foo').then(() => {
        done(new Error('"foo" should not resolve'))
      }).catch((e) => {
        debug(e)
        expect(e.toString()).toMatch(/foo/)
        done()
      }).catch(done)
    })


    it('should throw if circular dependency is detected', function (done) {
      const foo = function () {}
      const bar = function () {}
      const baz = function () {}
      dik.register('foo', foo, { deps: ['bar'] })
      dik.register('bar', bar, { deps: ['baz'] })
      dik.register('baz', baz, { deps: ['foo'] })
      dik.get('foo').then(() => {
        done(new Error('"foo" should not resolve'))
      }).catch((e) => {
        debug(e)
        expect(e.toString()).toMatch(/foo/)
        done()
      }).catch(done)
    })


    it('should resolve special "$get" resource', function (done) {
      const foo = function (get) {
        expect(get).toBeA(Function)
        return 'FOO'
      }
      const bar = function (get) {
        expect(get).toBeA(Function)
        get('foo').then((f) => {
          expect(f).toEqual('FOO')
        })
      }
      dik.register('foo', foo, { deps: ['$get'] })
      dik.register('bar', bar, ['$get'])
      dik.get('foo').then(() => {
        return dik.get('bar').then(done)
      }).catch(done)
    })


    it('should pass resolved dependencies', function (done) {
      const foo = function (bar, baz, qux) {
        debug(arguments)
        expect(bar).toBe('BAR')
        expect(baz).toBe('BAZ')
        expect(qux).toBe('QUX')
        return ['FOO', bar, baz, qux].join(':')
      }
      dik.register('foo', foo, { deps: ['bar', 'baz', 'qux'] })
      dik.register('bar', () => 'BAR')
      dik.register('baz', () => 'BAZ')
      dik.register('qux', () => 'QUX')
      dik.get('foo').then((r) => {
        expect(r).toBe('FOO:BAR:BAZ:QUX')
        done()
      }).catch(done)
    })


    it('should pass resolved dependencies passed as array', function (done) {
      const foo = function (bar, baz, qux) {
        debug(arguments)
        expect(bar).toBe('BAR')
        expect(baz).toBe('BAZ')
        expect(qux).toBe('QUX')
        return ['FOO', bar, baz, qux].join(':')
      }
      dik.register('foo', foo, ['bar', 'baz', 'qux'])
      dik.register('bar', () => 'BAR')
      dik.register('baz', () => 'BAZ')
      dik.register('qux', () => 'QUX')
      dik.get('foo').then((r) => {
        expect(r).toBe('FOO:BAR:BAZ:QUX')
        done()
      }).catch(done)
    })


    it('should return cached resource', function (done) {
      let count = 0
      const foo = function () { count += 1; return 'FOO'; }
      dik.register('foo', foo)
      dik.get('foo').then(() => {
        return dik.get('foo').then(() => {
          expect(count).toEqual(1)
          done();
        })
      }).catch(done);
    })


    it('should cache dependencies', function (done) {
      let count = 0
      const foo = function () { count += 1 }
      const bar = function () {}
      const baz = function () {}
      dik.register('foo', foo)
      dik.register('bar', bar, { deps: ['foo'] })
      dik.register('baz', baz, { deps: ['bar'] })
      dik.get('foo').then(() => {
        return dik.get('bar').then(() => {
          return dik.get('baz').then(() => {
            expect(count).toEqual(1)
            done()
          })
        })
      }).catch(done)
    })


    describe('with Promises', function () {

      it('should throw if resource not registered', function (done) {
        const foo = function () {
          return new Promise((resolve) => setTimeout(resolve, 2))
        }
        dik.register('foo', foo, { deps: ['bar'] })
        dik.get('foo').catch((err) => {
          expect(err.toString()).toMatch(/bar/)
          done()
        })
      })


      it('should throw if circular lookup is detected', function (done) {
        const foo = function () {
          return new Promise((resolve) => setTimeout(resolve, 2))
        }
        const bar = function () {
          return new Promise((resolve) => setTimeout(resolve, 4))
        }
        const baz = function (get) {
          return new Promise((resolve, reject) => setTimeout(() => {
            get('foo').then(resolve, reject)
          }, 8))
        }
        dik.register('foo', foo, { deps: ['bar'] })
        dik.register('bar', bar, { deps: ['baz'] })
        dik.register('baz', baz, { deps: ['$get'] })
        dik.get('foo').then(() => {
          done(new Error('"foo" should not resolve'))
        }).catch((e) => {
          debug(e)
          expect(e.toString()).toMatch(/foo/)
          done()
        }).catch(done)
      })


      it('should throw if circular dependency is detected', function (done) {
        const foo = function () {
          return new Promise((resolve) => setTimeout(resolve, 2))
        }
        const bar = function () {
          return new Promise((resolve) => setTimeout(resolve, 4))
        }
        const baz = function () {
          return new Promise((resolve) => setTimeout(resolve, 8))
        }
        dik.register('foo', foo, { deps: ['bar'] })
        dik.register('bar', bar, { deps: ['baz'] })
        dik.register('baz', baz, { deps: ['foo'] })
        dik.get('foo').then(() => {
          done(new Error('"foo" should not resolve'))
        }).catch((e) => {
          debug(e)
          expect(e.toString()).toMatch(/foo/)
          done()
        }).catch(done)
      })


      it('should be called with resolved dependencies', function (done) {
        const foo = function (Bar, Baz, Coq) {
          return new Promise((resolve) => {
            setTimeout(() => resolve(['FOO', Bar, Baz, Coq].join(':')), 2)
          })
        }
        const bar = function () {
          return new Promise((resolve) => {
            setTimeout(() => resolve('BAR'), 4)
          })
        }
        const baz = function () {
          return new Promise((resolve) => {
            setTimeout(() => resolve('BAZ'), 8)
          })
        }
        const qux = function () {
          return 'QUX'
        }
        const coq = function (get) {
          return get('qux').then((Qux) => {
            return Qux + ':COQ'
          })
        }
        dik.register('foo', foo, { deps: ['bar', 'baz', 'coq'] })
        dik.register('bar', bar)
        dik.register('baz', baz)
        dik.register('qux', qux)
        dik.register('coq', coq, { deps: ['$get'] })
        dik.get('foo').then((r) => {
          expect(r).toBe('FOO:BAR:BAZ:QUX:COQ')
          done()
        }).catch(done)
      })


      it('should cache dependencies', function (done) {
        let fooCount = 0
        let quxCount = 0
        const foo = function () {
          return new Promise((resolve) => {
            setTimeout(() => {
              fooCount += 1
              resolve()
            }, 8)
          })
        }
        const bar = function () {
          return new Promise((resolve) => {
            setTimeout(resolve, 4)
          })
        }
        const baz = function () {
          return new Promise((resolve) => {
            setTimeout(resolve, 2)
          })
        }
        const qux = function () {
          quxCount += 1
          return 'QUX'
        }
        const coq = function (get) {
          return get('qux')
        }
        dik.register('foo', foo)
        dik.register('bar', bar, { deps: ['foo'] })
        dik.register('baz', baz, { deps: ['bar'] })
        dik.register('qux', qux, { deps: ['baz'] })
        dik.register('coq', coq, { deps: ['$get'] })
        dik.get('foo').then(() => {
          return dik.get('bar').then(() => {
            return dik.get('baz').then(() => {
              return dik.get('qux').then(() => {
                return dik.get('coq').then(() => {
                  expect(fooCount).toEqual(1)
                  expect(quxCount).toEqual(1)
                  done()
                })
              })
            })
          })
        }).catch(done)
      })

    })

  })

})
