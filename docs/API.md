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


