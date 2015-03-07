/* jshint mocha:true */

import request from 'supertest'
import di from './resources'


describe('example', function () {

  let app


  before(function (done) {
    di.get('app')
      .then((res) => { app = res; done() })
      .catch(done)
  })


  it('should render Main', function (done) {
    request(app)
      .get('/')
      .expect('<div class="App"><div class="Main"><h1>Main</h1></div></div>', done)
  })


  it('should render About', function (done) {
    request(app)
      .get('/about')
      .expect('<div class="App"><div class="About"><h1>About</h1></div></div>', done)
  })

})
