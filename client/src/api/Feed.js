import request from 'superagent-bluebird-promise'

const API_URL = process.env.API_URL

export default {
    getFeed() {
        return request.get(`${API_URL}/feed`)
            .set({
                Accept: 'application/json',
            })
            .then(res => res.body)
    },
}
