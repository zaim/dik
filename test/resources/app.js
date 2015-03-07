import express from 'express'
import React from 'react'
import Router from 'react-router'


function createHandler (routes) {
  const app = express()
  app.get('*', function (req, res) {
    Router.run(routes, req.url, function (Handler) {
      res.send(React.renderToStaticMarkup(<Handler/>))
    })
  })
  return app
}


function createApp () {
  return this.get('routes').then(createHandler)
}


export default createApp
