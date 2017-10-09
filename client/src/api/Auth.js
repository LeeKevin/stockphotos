import request from 'superagent-bluebird-promise'

const { API_URL, CLIENT_ID } = process.env

export default {
    login({ email, password }) {
        return request
            .post(`${API_URL}/auth/token`)
            .set({
                Accept: 'application/json',
                Authorization: `Basic ${btoa(`${email}:${password}`)}`,
            })
            .then((res) => {
                localStorage.token = res.body.access_token

                return res.body.access_token
            })
    },

    facebookLogin(accessToken) {
        return request
            .post(`${API_URL}/auth/convert-token`)
            .send({
                grant_type: 'convert_token',
                backend: 'facebook',
                token: accessToken,
                client_id: CLIENT_ID,
            })
            .then((res) => {
                localStorage.token = res.body.access_token

                return res.body.access_token
            })
    },

    authenticateToken(accessToken) {
        return request
            .get(`${API_URL}/accounts/me`)
            .set('Authorization', `Bearer ${accessToken}`)
            .then(res => res.body)
    },

    logout(accessToken, callback) {
        if (!accessToken) {
            callback()
            return
        }

        request
            .post(`${API_URL}/auth/revoke-token`)
            .set({
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
                Authorization: `Bearer ${accessToken}`,
            })
            .send({
                token: accessToken,
                client_id: CLIENT_ID,
            })
            .end(() => {
                callback()
            })
    },

    checkEmail(email) {
        const headers = {
            Accept: 'application/json',
        }

        if (localStorage.token) {
            headers.Authorization = `Bearer ${localStorage.token}`
        }

        return request
            .post(`${API_URL}/accounts/check-email`)
            .send({ email })
            .set(headers)
            .then(res => res.body)
    },

    signUp(data) {
        return request
            .post(`${API_URL}/auth/sign-up`)
            .send({
                ...data,
                client_id: CLIENT_ID,
            })
            .set({
                Accept: 'application/json',
            })
            .then((res) => {
                localStorage.token = res.body.access_token

                return this.authenticateToken(res.body.access_token)
            })
    },
}
