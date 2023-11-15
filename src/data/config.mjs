const config = {
    'env': {
        'validation': {
            'API_KEY': {
                'regex':  /^(?=.*[0-9])(?=.*[A-Za-z])[0-9A-Za-z]{42}$/,
                'message': 'Key "API_KEY" must have the length of 42, with at least char and numbers.',
                'header': 'X-API-KEY'
            },
            'PORT': {
                'regex': /^\d{2,4}$/,
                'messages': 'Key "PORT" must be 2 to 4 digits long.'
            }
        }
    },
    'environment': {
        'development': {
            'env': './.env'
        },
        'server': {}
    }
} 


export { config }