import { config } from './data/config.mjs'
import { MinaData } from 'minadata'
import { printMessages } from './helpers/mixed.mjs'

import express from 'express'
import fs from 'fs'
import path from 'path'
import moment from 'moment'


export class MinaServer {
    #config
    #app
    #silent
    #state


    constructor( silent=false ) {
        this.#silent = silent
        this.#config = config
    }


    init( { environment='developement', version='' } ) {
        const [ messages, comments ] = this.#validateInit( { environment } )
        printMessages( { messages, comments } )
        
        this.#state = {
            'environment': environment,
            'version': version,
            'secrets': {},
            'privacy': ''
        }

        this.#state['secrets'] = this.#addSecrets()
        const [ m, c ] = this.#validateSecrets()
        printMessages( { 'messages': m, 'comments': c } )

        this.#state['privacy'] = fs
            .readFileSync( './public/privacy.html', 'utf-8' )
            .replace( `{{DATE}}`, moment().format( 'YYYY-MM-DD' ) )
            .replace( `{{EMAIL}}`, this.#state['secrets']['EMAIL'] )

        return this
    }


    start() {
        this.#addServer()
        this.#trackReponse()
        this.#addRoutes()
        this.#addCatchAllRoute()

        return true
    }


    getOpenAiSchema( { title, description, version, url } ) {
        const [ m, c ] = this.#validateOpenAISchema( { title, description, version, url } )
        printMessages( { 'messages': m, 'comments': c } )

        const minaData = new MinaData()
        minaData.init( {} )

        const struct = {
            'openapi': '3.1.0',
            'info': null,
            'servers': [],
            'paths': null,
            'comments': {
                'schemas': {}
            }
        }
        
        struct['info'] = [ 
            [ 'title', title ],
            [ 'description', description ],
            [ 'version', version ]
        ]
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a 
                acc[ key ] = value
                return acc
            }, {} )
        
        struct['servers']
            .push( { url } )
        
        struct['paths'] = minaData
            .getPresets()
            .reduce( ( acc, a, index ) => {
                const key = `/{network}/${a}`
                acc[ key ] = {
                    'get': {
                        'description': null,
                        'operationId': null,
                        'parameters': null,
                        'deprecated': false
                    }
                }

                const preset = minaData.getPreset( { 'key': a } )
                const k = Object
                    .keys( preset['input']['variables'][ Object.keys( preset['input']['variables'] )[ 0 ] ]['default'] )

                let description = ''
                description += `${preset['description']} `
                description += `As Network is ONLY allowed: ${k.map( a => `'${a}'`).join( ',' )}`

                acc[ key ]['get']['description'] = description
                acc[ key ]['get']['operationId'] = a
                acc[ key ]['get']['parameters'] = Object
                    .entries( preset['input']['variables'] )
                    .reduce( ( abb, a, index ) => { 
                        const [ k, v ] = a
                        if( index === 0 ) {
                            abb.push( {
                                'name': 'network',
                                'in': 'path',
                                'required': true,
                                'description': 'The network identifier.',
                                'schema': {
                                    'type': 'string',
                                    'pattern': `^(${Object.keys( v['default'] ).join( '|' )})$`
                                }
                            } )
                        }
                        abb.push( {
                            'name': k,
                            'in': 'query',
                            'description': `${v['description']} ${v['validation']['description']}'`,
                            'required': a['required'],
                            'schema': {
                                'type': 'string',
                                'pattern': v['validation']['regex'].source
                            }
                        } )
    
                        return abb
                    }, [] )
                return acc
            }, {} )

        return struct
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
                    messages.push( `${this.#config['env']['validation'][ key ]['message']}` )
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
            messages.push( `Key "environment" is not type of "string".` )
        }

        return [  messages, comments ]
    }


    #validateOpenAISchema( { title, description, version, url } ) {
        const messages = []
        const comments = []

        const tmp = [
            [ 'title', title ],
            [ 'description', description ],
            [ 'version', version ],
            [ 'url', url ]
        ]
            .forEach( a => {
                if( a[ 1 ] === undefined || a[ 1 ] === null ) {
                    messages.push( `Key '${a[ 0 ]}' is missing.` )
                } else if( typeof a[ 1 ] !== 'string' ) {
                    messages.push( `Key '${a[ 0 ]} is not type of 'string''`)
                }
            } )

        return [ messages, comments ]
    }


    #addSecrets() {
        let result = {}

        if( 
            this.#state['environment'] === 'development' ||
            this.#state['environment'] === 'quickstart'
        ) {
            const key = this.#state['environment']
            result = fs
                .readFileSync( this.#config['environment'][ key ]['env'], 'utf-8' )
                .split( "\n" )
                .reduce( ( acc, a, index ) => {
                    const str = a.trim()
                    const [ key, value ] = str
                        .split( '=' )
                        .map( a => a.trim() )
                    acc[ key ] = value
                    return acc
                }, {} )
        } else if( this.#state['environment'] === 'staging' ) {
            result = Object
                .keys( this.#config['env']['validation'] )
                .reduce( ( acc, key, index ) => {
                    acc[ key ] = process.env[ key ]
                    return acc
                }, {} )
        } else {
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


    #trackReponse() {
        this.#app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} Request to ${req.url}`);
            console.log('Headers:', req.headers);
            next();
          });
    }


    #addRoutes() {
        const addApiKeyHeader = ( req, res, next ) => {
            const apiKey = req.get( this.#config['env']['validation']['API_KEY']['header'] )
            if( apiKey && apiKey === this.#state['secrets']['API_KEY'] ) {
                next()
            } else {
                res
                    .status( 401 )
                    .json( { 'message': 'Invalid API Key' } )
            }
        }

        this.#app.get(
            '/health', 
            // addApiKeyHeader,
            ( req, res ) => {
                const randomNumber = Math.floor( Math.random() * 100 )
                res.json( { 'health': 'ok', 'version': this.#state['version'] } )
            } 
        )

        const minaData = new MinaData()
        minaData.init( { 'network': 'berkeley' } )
        minaData
            .getPresets()
            .forEach( preset => {
                this.#app.get(
                    `/:network/${preset}`,
                    addApiKeyHeader, 
                    async ( req, res ) => {
                        try {
                            const { network } = req.params
                            const userVars = req.query  
                            const [ m, c ] = minaData.validateGetData( 
                                { preset, userVars, network } 
                            )
    
                            if( m.length !== 0 ) {

                                const msgs = [ 
                                    [ 'message', m ], 
                                    [ 'comment', c ]
                                ]
                                    .reduce( ( acc, a, index ) => {
                                        const [ key, values ] = a
                                        !Object.hasOwn( acc, key ) ? acc[ key ] = [] : ''
                                        values.forEach( value => acc[ key ].push( value ) )
                                        return acc
                                    }, {} )


                                res.json( { 
                                    'data': {},
                                    'status': {
                                        'code': 400,
                                        'text': msgs
                                    } 
                                } )
                            } else {
                                const result = await minaData.getData( { preset, userVars, network } )
                                res.json( { 
                                    'result': result['data'], 
                                    'status': result['status']
                                } )
                            }
                        } catch( e ) {
                            console.log( 'e', e )
                            res.json( { 
                                'data': {},
                                'status': {
                                    'code': 400,
                                    'text': e
                                } 
                            } )
                        }
                    } 
                )
            } )

        this.#app.get(
            '/privacy', 
            ( req, res ) => {
                res.setHeader('Content-Type', 'text/html');
                res.send( this.#state['privacy'] ) 
            }
        )

        return true
    }
}