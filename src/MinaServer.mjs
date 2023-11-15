import { config } from './data/config.mjs'
import express from 'express'
import { printMessages } from './helpers/mixed.mjs'
import fs from 'fs'


export class MinaServer {
    #config
    #app
    #silent
    #state


    constructor( silent=false ) {
        this.#silent = silent
        this.#config = config
    }


    init( { environment='developement' } ) {
        const [ messages, comments ] = this.#validateInit( { environment } )
        printMessages( { messages, comments } )
        
        this.#state = {
            'environment': environment,
            'secrets': {}
        }

        this.#state['secrets'] = this.#addSecrets()
        const [ m, c ] = this.#validateSecrets()
        printMessages( { 'messages': m, 'comments': c } )

        return this
    }


    start() {
        this.#addServer()
        this.#addApiKeyHeader()
        this.#addRoutes()
        this.#addCatchAllRoute()

        return true
    }


    #validateSecrets() {
        const messages = []
        const comments = []
 
        const keys = Object.keys( this.#config['env']['validation'] )

        keys
            .forEach( key => {
                if( !Object.hasOwn( this.#state['secrets'], key ) ) {
                    messages.push( `Key "${key}" is not found in .env` )
                    return true
                } 

                const test = this.#state['secrets'][ key ]
                    .match( this.#config['env']['validation'][ key ]['regex'] )
                if( test === null ) {
                    messages.push( `${this.#config['env']['validation'][ key ]['message']}`)
                    return true
                }
            } )

        return [ messages, comments ]
    }


    #validateInit( { environment } ) {
        const messages = []
        const comments = []

        if( typeof environment === 'string' ) {
            if( !Object.keys( this.#config['environment'] ).includes( environment ) ) {
                messages.push( `Key "environemt" with value "${environment}" is not excepted as answer. Choose from ${JSON.stringify( environment )}.`)
            }
        } else {
            messages.push( `Key "environment" is not type of "string".`)
        }

        return [  messages, comments ]
    }


    #addSecrets() {
        let result = {}
        switch( this.#state['environment'] ) {
            case 'development':
                result = fs
                    .readFileSync( this.#config['environment']['development']['env'], 'utf-8')
                    .split( "\n" )
                    .reduce( ( acc, a, index ) => {
                        const str = a.trim()
                        const [ key, value ] = str
                            .split( '=' )
                            .map( a => a.trim() )
                        acc[ key ] = value
                        return acc
                    }, {} )
                break
            case 'server':
                    result = Object
                        .keys( this.#config['env']['validation'] )
                        .reduce( ( acc, key, index ) => {
                            acc[ key ] = process.env[ key ]
                            return acc
                        }, {} )
                break
            default:
                console.log( `The "environment" with the value "${environment}" key does not have any associated .env files.` )
                process.exit( 1 )    
        }

        return result
    }


    #addCatchAllRoute() {
        this.#app.use( ( req, res ) => {
            res
                .status( 404 )
                .json( { 'message': 'Invalid route' } )
        } )

        return true
    }


    #addServer() {
        this.#app = express();
        this.#app.listen(
            this.#state['secrets']['PORT'], 
            () => {
                switch( this.#state['environment'] ) {
                    case 'development':
                        console.log( `http://localhost:${this.#state['secrets']['PORT']}` )
                        break
                    case 'server':
                        console.log( `Server is running on port ${this.#state['secrets']['PORT']}` )
                        break
                    default:
                }

            }
        )

        return true
    }

    
    #addApiKeyHeader() {
        this.#app.use(
            ( req, res, next ) => {
                const apiKey = req.get( this.#config['env']['validation']['API_KEY']['header'] )
                console.log( 'sended', apiKey )
                console.log( 'expected', this.#state['secrets']['API_KEY'] )

                if( apiKey && apiKey === this.#state['secrets']['API_KEY'] ) {
                    next()
                } else {
                    res
                        .status( 401 )
                        .json( { 'message': 'Invalid API Key' } )
                }
            }
        )

        return true
    }


    #addRoutes() {
        this.#app.get(
            '/getRandomNumber', 
            ( req, res ) => {
                const randomNumber = Math.floor( Math.random() * 100 )
                res.json( { 'number': randomNumber } )
            } 
        )

        return true
    }
}