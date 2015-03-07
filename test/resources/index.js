import Dik from '../../index.es6'
import createApp from './app'
import createRoutes from './routes'

const di = new Dik()
  .register('app', createApp)
  .register('routes', createRoutes)

export default di
