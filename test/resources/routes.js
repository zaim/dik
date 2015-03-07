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
