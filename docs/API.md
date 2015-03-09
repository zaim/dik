## API

### `Dik`

The Dik container class.


### Example

```js
const dik = new Dik()
```


### `Dik#register(id, fn, options)`

Register a resource provider


### Parameters

| parameter | type     | description                               |
| --------- | -------- | ----------------------------------------- |
| `id`      | string   | The unique ID to register the resource as |
| `fn`      | function | The resource provider function            |
| `options` | object   | _optional:_ Options                       |


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

// Specify dependencies.
dik.register('baz', function (bar) {
  return 'BAZ -> ' + bar
}, {
  deps: ['bar']
})
```


**Returns** `Dik`, self 


### `Dik#get(id)`

Look up a registered resource and its dependencies


### Parameters

| parameter | type   | description                             |
| --------- | ------ | --------------------------------------- |
| `id`      | string | - The registered resource provider's ID |


### Example

```js
dik.get('baz').then((res) => {
  expect(res).toEqual('BAZ -> BAR -> FOO')
})
```


**Returns** `Promise`, - A Promise for the created resource object 


