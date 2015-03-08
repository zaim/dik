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
      const baz = function () {
        return this.get('foo')
      }
      dik.register('foo', foo, { deps: ['bar'] })
      dik.register('bar', bar, { deps: ['baz'] })
      dik.register('baz', baz)
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


    it('should be called with the container as context', function (done) {
      const foo = function () {
        expect(this).toBe(dik)
        done()
      }
      dik.register('foo', foo)
      dik.get('foo')
    })


    it('should be called with resolved dependencies', function (done) {
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
        const baz = function () {
          return new Promise((resolve, reject) => setTimeout(() => {
            this.get('foo').then(resolve, reject)
          }, 8))
        }
        dik.register('foo', foo, { deps: ['bar'] })
        dik.register('bar', bar, { deps: ['baz'] })
        dik.register('baz', baz)
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
        const coq = function () {
          return this.get('qux').then((Qux) => {
            return Qux + ':COQ'
          })
        }
        dik.register('foo', foo, { deps: ['bar', 'baz', 'coq'] })
        dik.register('bar', bar)
        dik.register('baz', baz)
        dik.register('qux', qux)
        dik.register('coq', coq)
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
        const coq = function () {
          return this.get('qux')
        }
        dik.register('foo', foo)
        dik.register('bar', bar, { deps: ['foo'] })
        dik.register('baz', baz, { deps: ['bar'] })
        dik.register('qux', qux, { deps: ['baz'] })
        dik.register('coq', coq)
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
