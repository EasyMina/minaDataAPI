import { MinaServer } from '../src/MinaServer.mjs'
import fs from 'fs'

const minaServer = new MinaServer()

const url = fs.readFileSync( '.env', 'utf-8' )
    .split( "\n" )
    .filter( a => a.startsWith( 'URL' ) )
    .map( a => a.split( '=' )[ 1 ] )[ 0 ]

const nn = [
    [ 'E4', 'Memo Hash' ],
    [ '5J', 'Transaction Hash' ],
    [ 'B62', 'Mina Address' ]
]

const version = 'v0.0.2'
const schema = minaServer.getOpenAiSchema( { 
    'title': 'Learn Mina Blockchain API',
    'description': `The Learn Mina Blockchain API provides tools for querying the Mina blockchain, supporting operations such as retrieving account balances and transaction details, specifically for the 'berkeley' network. It allows for precise queries with various parameters, including public keys and block heights, and is accessible via ${url}.`,
    version,
    url
} )

console.log( JSON.stringify( schema, null, 4 ) )

fs.writeFileSync( 
    `./openai/schema-${version}.json`, 
    JSON.stringify( schema, null, 2 ), 
    'utf-8' 
)