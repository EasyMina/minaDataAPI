async function main() {
    const { MinaServer } = await import( './src/MinaServer.mjs' )

    const minaServer = new MinaServer()

    try {
        const version = 'v0.3'
        console.log( `Start server! Version: ${version}` )
        minaServer
            .init( { 
                'environment': 'staging', 
                version
            } )
            .start()
    } catch( e ) {
        console.log( `Error: ${e}` )
    }

    return true
}


main()
    .then( a => console.log( a ) )
    .catch( e => console.log( e ) )




