# dik
> A small dependency-injection container with `Promises` support

## Installation

```
$ npm install --save dik
```

## Usage

```javascript
import Dik from 'dik'
import expect from 'expect'

const dik = new Dik()

dik.register('foo', function () {
  return 'FOO'
})

dik.register('bar', function () {
  // lookup other resources
  return this.get('foo').then((foo) => {
    return 'BAR -> ' + foo
  })
})

dik.register('baz', function (bar) {
  return 'BAZ -> ' + bar
}, {
  // or specify other resources as dependencies
  deps: ['bar']
})

dik.get('baz').then((res) => {
  expect(res).toEqual('BAZ -> BAR -> FOO')
})
```

## Example

A simple example of server-side React rendering with express and react-router.

Although `Dik` is isomorphic, the example below is only half (arguably not
that interesting half) of what it can do. A more involved example with
client- and server-side Flux is coming soon.

### `start.js`

```javascript
import { createServer } from 'http'
import di from './index'

di.get('app').then((app) => createServer(app).listen(3000))
```

### `index.js`

```javascript
import Dik from 'dik'
import createApp from './app'
import createRoutes from './routes'

const di = new Dik()
  .register('app', createApp)
  .register('routes', createRoutes)

export default di
```

### `app.js`

```javascript
import express from 'express'
import React from 'react'
import Router from 'react-router'

function createApp () {
  return this.get('routes').then(createHandler)
}

function createHandler (routes) {
  const app = express()
  app.get('*', function (req, res) {
    Router.run(routes, req.url, function (Handler) {
      res.send(React.renderToStaticMarkup(<Handler/>))
    })
  })
  return app
}

export default createApp
```

### `routes.js`

```javascript
import React from 'react'
import Router from 'react-router'

const { Route, DefaultRoute, RouteHandler } = Router

const App = React.createClass({
  render () {
    return <div className="App"><RouteHandler /></div>
  }
})

const Main = React.createClass({
  render () {
    return <div className="Main"><h1>Main</h1></div>
  }
})

const About = React.createClass({
  render () {
    return <div className="About"><h1>About</h1></div>
  }
})

export default function createRoutes () {
  return (
    <Route handler={App} path="/">
      <DefaultRoute handler={Main} />
      <Route name="about" handler={About} path="about" />
    </Route>
  )
}
```

## API

### `constructor`

```javascript
const di = new Dik()
```

Instantiates a new container.

### `register`

```javascript
di.register(id: string, fn: Function, options: ?object): Dik
```

Register a resource provider. The resource provider function, `fn`, will be
called with the container (`di`) as its `this` context when the resource is
looked up using `get()`.

The resource provider function can return any value, including a `Promise`.

Returns chainable, self, `di`.

* `id: string` - The unique ID to register the resouce as
* `fn: Function` - The resouce provider function
* `options: ?object` - Optional options hash, with the below properties:
  * `options.deps: array` - Array of resource ID strings this resource depends on

### `get`

```javascript
di.get(id: string): Promise
```

Look up a registered resource.

Returns a `Promise` for the resource object as returned by its provider function.

* `id: string` - The registered resource provider ID

## License

Dik is released under the MIT license.
