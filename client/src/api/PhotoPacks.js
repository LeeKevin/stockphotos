import request from 'superagent-bluebird-promise'

const API_URL = process.env.API_URL

export default {
    getMyPhotoPacks() {
        return request
            .get(`${API_URL}/accounts/me/collections`)
            .set({
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.token}`,
            })
            .then(res => res.body)
    },
}
