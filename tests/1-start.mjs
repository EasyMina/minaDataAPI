import { MinaServer } from './../src/MinaServer.mjs'

const minaServer = new MinaServer()
minaServer
    .init( { 
        'environment': 'development',
        'version': 'v0.2'
    } )
    .start()