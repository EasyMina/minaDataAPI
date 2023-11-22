



# Mina Data API

MinaDataServer adds an API that works with OpenAI's Custom GPT. It automatically creates routes from MinaData, which you can see [here](https://github.com/EasyMina/minaData/blob/main/src/data/presets.mjs). Use an `x-api-key` in the header for security, set up with `.init({})`. It also has a `/health` route to check the server's status and a `/privacy` route, with details in `./public/privacy.html`.


## Quickstart

### Run Server

```js
import { MinaServer } from './src/MinaServer.mjs'
const minaServer = new MinaServer()
minaServer
    .init( { 'environment': 'quickstart' } )
    .start()
```

### Generate OpenAI Schema

```js
import { MinaServer } from './src/MinaServer.mjs'
const minaServer = new MinaServer()
const schema = minaServer.getOpenAiSchema( { 
    'title': 'My Title',
    'description': `My description`,
    'version': 'v0.0.2',
    'url': 'https://...'
} )
console.log( JSON.stringify( schema, null, 4 ) )
```


## Table of Contents

- [Mina Data API](#mina-data-api)
  - [Quickstart](#quickstart)
    - [Run Server](#run-server)
    - [Generate OpenAI Schema](#generate-openai-schema)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Methods](#methods)
    - [init( {} )](#init--)
    - [start()](#start)
    - [getOpenAISchema](#getopenaischema)
  - [Deployment](#deployment)
  - [License](#license)

## Features

- Add `/{network}/{presets}` routes. Autogenerate all available routes from `minaData`. See [...minaData/src/data/presets.mjs](https://github.com/EasyMina/minaData/blob/main/src/data/presets.mjs) for more Informations.
- Add Header Api Key through key `x-api-key`. To set secrets see `.init({})`
- OpenAI Schema generator, for Custom GPT integration.
- Add `/health` route
- Add `/privacy` route. You can find the template here: `./public/privacy.html`


## Methods
Public methods include init, start, and getOpenAISchema.


### init( {} )

The following key/value pairs are editable:

| Name         | Description                                       | Required | Default        | Type                                     |
|--------------|---------------------------------------------------|----------|----------------|------------------------------------------|
| environment  | Is needed to locate the environment variables. For 'developement' it expect a file on `./.env`. For `staging` search in `process.env`    | Yes      | `development`  | `string` [ 'development', 'staging' ] |
| version      | The version number of the application             | No       | `` (empty string) | string                                   |

For informations you can find under `./src/data/config.mjs`

**Returns**: 
```js
return this
```


**Example**: 
```js
const { MinaServer } = await import( './src/MinaServer.mjs' )
const minaServer = new MinaServer()
minaServer
    .init( { 'environment': 'quickstart', 'version': 'v0.2' } )
    .start()

```


### start()

Start the server after settings via .init({}).

**Example**: 
```js
const { MinaServer } = await import( './src/MinaServer.mjs' )
const minaServer = new MinaServer()
minaServer
    .init( { 'environment': 'quickstart', 'version': 'v0.2' } )
    .start()

```


### getOpenAISchema

Generate an OpenAI Schema configuration file for Custom GPT integration.

```js
const schema = minaServer.getOpenAiSchema( { 
    'title': 'Title',
    'description': `Description`,
    'version': '',
    'url': 'https://...'
} )
```



## Deployment

Quickly deploy on a cost-effective $5 server using the Digital Ocean Apps Platform. You can find the deploy script here: `.do/deploy.template.yaml`

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/easyMina/minaDataAPI/tree/main)


## License

This project is licensed under the [Apache 2.0](LICENSE).