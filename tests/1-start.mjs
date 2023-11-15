import { MinaServer } from './../src/MinaServer.mjs'

const minaServer = new MinaServer()
minaServer
    .init( { 
        'environment': 'development'
    } )
    .start()