import { MinaServer } from './../src/MinaServer.mjs'

const minaServer = new MinaServer()

try {
    console.log( `Start server!` )
    minaServer
        .init( { 'environment': 'server' } )
        .start()
} catch( e ) {
    console.log( `Error: ${e}` )
}
