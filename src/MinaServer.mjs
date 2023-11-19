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


    init( { environment='developement' } ) {
        const [ messages, comments ] = this.#validateInit( { environment } )
        printMessages( { messages, comments } )
        
        this.#state = {
            'environment': environment,
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
        const minaData = new MinaData()
        minaData.init( { 'network': 'berkeley' } )
    
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
                acc[ key ]['get']['description'] = preset['description']
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
console.log( '>>>', key )
console.log( '>>>', this.#state['secrets'] )
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

        this.#app.get(
            '/health', 
          //  addApiKeyHeader,
            ( req, res ) => {
                const randomNumber = Math.floor( Math.random() * 100 )
                res.json( { 'health': 'ok', 'version': 'v0.1' } )
            } 
        )

        const minaData = new MinaData()
        minaData.init( { 'network': 'berkeley' } )
        minaData
            .getPresets()
            .forEach( key => {
                this.#app.get(
                    `/:network/${key}`,
                    addApiKeyHeader, 
                    async ( req, res ) => {
                        const { network } = req.params;
                        const preset = key
                        const { params, test } = req.query
                        const userVars = req.query

                        const [ m, c ] = minaData.validateGetData( 
                            { preset, userVars, network } 
                        )

                        if( m.length !== 0 ) {
                            res.json( { 'params': [ m, c ], 'status': 'Input error' } )
                        } else {
                            const result = await minaData.getData( { preset, userVars, network})
                            res.json( { result, 'status': 'success' } )
                        }
                    } 
                )
            } )

        this.#app.get(
            '/getRandomNumber', 
            addApiKeyHeader,
            ( req, res ) => {
                const randomNumber = Math.floor( Math.random() * 100 )
                res.json( { 'number': randomNumber, 'status': 'ok' } )
            } 
        )

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