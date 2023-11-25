import { MinaServer } from '../src/MinaServer.mjs'

try {
    const minaServer = new MinaServer()
    const version = 'v0.0.2'
    const schema = minaServer.getOpenAiSchema( { 
        'title': 'Learn Mina Blockchain API',
        'description': `The Learn Mina Blockchain API provides tools for querying the Mina blockchain, supporting operations such as retrieving account balances and transaction details, specifically for the 'berkeley' network. It allows for precise queries with various parameters, including public keys and block heights, and is accessible via ${url}.`,
        'version': 'v0.0.2',
        'url': '...'
    } )
    console.log( 'Success!' )
    process.exit( 0 )
} catch( e ) {
    console.log( 'Error!' )
    process.exit( 1 )
}


