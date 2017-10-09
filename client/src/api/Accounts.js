import request from 'superagent-bluebird-promise'

const { API_URL } = process.env

export default {
    updateSubscription(data) {
        return request
            .post(`${API_URL}/accounts/me/subscription`)
            .send(data)
            .set({
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.token}`,
            })
            .then(res => res.body)
    },

    updateUser(data) {
        return request
            .put(`${API_URL}/accounts/me`)
            .send(data)
            .set({
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.token}`,
            })
            .then(res => res.body)
    },

    uploadPhoto(file) {
        return request
            .post(`${API_URL}/accounts/me/photo`)
            .send(file)
            .set({
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.token}`,
            })
            .then(res => res.body)
    },

    loadInvoices() {
        return request
            .get(`${API_URL}/accounts/me/invoices`)
            .set({
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.token}`,
            })
            .then(res => res.body)
    },

    getCardDetails() {
        return request
            .get(`${API_URL}/accounts/me/payment-method`)
            .set({
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.token}`,
            })
            .then(res => res.body)
    },

    updateCardDetails(token) {
        return request
            .post(`${API_URL}/accounts/me/payment-method`)
            .send({
                stripe_token: token,
            })
            .set({
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.token}`,
            })
            .then(res => res.body)
    },
}
