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
which can have a `deps` property which is an
array of resource provider ID strings that this
resource is dependant upon.

As a shortcut, the array of ID strings can also be
passed directly as the `options` argument.


### Parameters

| parameter | type     | description                                           |
| --------- | -------- | ----------------------------------------------------- |
| `id`      | string   | The unique ID to register the resource as             |
| `fn`      | function | The resource provider function                        |
| `options` | object   | _optional:_ Options object or array of dependency IDs |


### Example

```js
// Simple resource provider.
dik.register('foo', function () {
  return 'FOO'
})

// Lookup other resources.
dik.register('bar', function () {
  return this.get('foo').then((foo) => {
    return 'BAR -> ' + foo
  })
})

// Specify dependencies in options object.
dik.register('baz', function (bar) {
  return 'BAZ -> ' + bar
}, { deps: ['bar'] })

// Specify dependencies in directly.
dik.register('baz', function (bar) {
  return 'BAZ -> ' + bar
}, ['bar'])
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
dik.get('baz').then((res) => {
  expect(res).toEqual('BAZ -> BAR -> FOO')
})
```


**Returns** `Promise`, A Promise for the created resource object 


