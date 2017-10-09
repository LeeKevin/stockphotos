import superagent from 'superagent-bluebird-promise'
import defaults from 'superagent-defaults'


const request = defaults(superagent)

request
    .set({
        Accept: 'application/json',
    })
    .on('response', (res) => {
        if (res && res.status === 401) {
            console.log('Unauthorized')
        }
    })

export default request
