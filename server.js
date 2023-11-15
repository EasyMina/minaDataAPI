async function main() {
    const { MinaServer } = await import( './src/MinaServer.mjs' )

    const minaServer = new MinaServer()

    try {
        console.log( `Start server!` )
        minaServer
            .init( { 'environment': 'server' } )
            .start()
    } catch( e ) {
        console.log( `Error: ${e}` )
    }

    return true
}


main()
    .then( a => console.log( a ) )
    .catch( e => console.log( e ) )




