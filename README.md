# dik

> A small dependency-injection container with `Promise` support


## Installation

```
$ npm install --save dik
```

Dik requires an ES5-compatible environment *and* a native (globally available)
`Promise`. It is recommended to use [babel](http://babeljs.io).


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
  .register('app', createApp, ['$get'])
  .register('routes', createRoutes)

export default di
```

### `app.js`

```javascript
import express from 'express'
import React from 'react'
import Router from 'react-router'

function createApp ($get) {
  return $get('routes').then(createHandler)
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


## Contributing

Issues and pull requests are welcomed. For code style, please use
[editorconfig](http://editorconfig.org/) and `jshint`.

### Running tests

```
$ git clone https://github.com/zaim/dik.git
$ npm install
$ npm test
```


## Prior Art

Dik was inspired by [Cation](https://github.com/sergiolepore/Cation) and
[create-container](https://github.com/ryanflorence/create-container).

`Cation` is a fully customizable DIC with Promises/async support. If you need
custom resource providers (e.g. Factories, Services, Static), use Cation.

`create-container` on the other hand is a minimal application container,
but without Promises/async. If you don't want or need asynchronous support,
use create-container.


## License

Dik is released under the [MIT license](./LICENSE).

## API

### `Dik`

The Dik container class.


### Example

```js
const dik = new Dik()
```


### `Dik#register(id, fn, options)`

Register a resource provider

The `options` argument can be an options object,
which may have these properties:

* `deps` - array of resource provider ID strings
  that this resource is dependent upon.

* `factory` - boolean, if true the resource will
  not be cached and a new instance is returned on
  every `get` call.

As a shortcut, the array of ID strings can also be
passed directly as the `options` argument.

A special resource id `$get` can be specified to
get access to the `Dik#get` method in the resource
provider function in order to look-up other resources
(see example below)


### Parameters

| parameter | type     | description                                           |
| --------- | -------- | ----------------------------------------------------- |
| `id`      | string   | The unique ID to register the resource as             |
| `fn`      | function | The resource provider function                        |
| `options` | object   | _optional:_ Options object or array of dependency IDs |


### Example

```js
// Simple resource provider:
dik.register('foo', function () {
  return 'FOO'
})

// Specify dependencies in options object:
dik.register('bar', function (baz) {
  return 'BAR -> ' + baz
}, { deps: ['baz'] })

// Specify dependencies in directly:
dik.register('bar', function (baz) {
  return 'BAR -> ' + baz
}, ['baz'])

// Lookup other resources:
dik.register('baz', function ($get) {
  return $get('foo').then((foo) => {
    return 'BAZ -> ' + foo
  })
}, [$get'])
```


**Returns** `Dik`, self 


### `Dik#get(id)`

Look up a registered resource and its dependencies


### Parameters

| parameter | type   | description                           |
| --------- | ------ | ------------------------------------- |
| `id`      | string | The registered resource provider's ID |


### Example

```js
dik.get('bar').then((res) => {
  expect(res).toEqual('BAR -> BAZ -> FOO')
})
```


**Returns** `Promise`, A Promise for the created resource object 


