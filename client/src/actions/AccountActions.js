import Dispatcher from '../Dispatcher'
import Accounts from '../api/Accounts'

export const UPDATE_USER_SUBSCRIPTION_FAILURE = 'UPDATE_USER_SUBSCRIPTION_FAILURE'
export const UPDATE_USER_SUBSCRIPTION_SUCCESS = 'UPDATE_USER_SUBSCRIPTION_SUCCESS'
export const USER_UPDATE_SUCCESS = 'USER_UPDATE_SUCCESS'
export const USER_UPDATE_FAILURE = 'USER_UPDATE_FAILURE'
export const PROFILE_PHOTO_SUCCESS = 'PROFILE_PHOTO_SUCCESS'
export const PROFILE_PHOTO_FAILURE = 'PROFILE_PHOTO_FAILURE'
export const LOAD_INVOICES = 'LOAD_INVOICES'
export const LOAD_CARD_DETAILS = 'LOAD_CARD_DETAILS'
export const UPDATE_CARD_DETAILS_SUCCESS = 'UPDATE_CARD_DETAILS_SUCCESS'
export const UPDATE_CARD_DETAILS_FAILURE = 'UPDATE_CARD_DETAILS_FAILURE'

export const AccountServerActions = {
    updateUserSubscriptionSuccess(user) {
        Dispatcher.dispatch({
            type: UPDATE_USER_SUBSCRIPTION_SUCCESS,
            data: user,
        })
    },
    updateUserSubscriptionFailure(error) {
        Dispatcher.dispatch({
            type: UPDATE_USER_SUBSCRIPTION_FAILURE,
            data: error,
        })
    },
    sendAccountUpdateSuccess(user) {
        Dispatcher.dispatch({
            type: USER_UPDATE_SUCCESS,
            data: user,
        })
    },

    sendAccountUpdateFailure(error) {
        Dispatcher.dispatch({
            type: USER_UPDATE_FAILURE,
            error,
        })
    },

    sendProfilePhotoUpdateSuccess(photo) {
        Dispatcher.dispatch({
            type: PROFILE_PHOTO_SUCCESS,
            data: photo,
        })
    },

    sendProfilePhotoUpdateFailure(error) {
        Dispatcher.dispatch({
            type: PROFILE_PHOTO_FAILURE,
            error,
        })
    },

    loadInvoices(invoices) {
        Dispatcher.dispatch({
            type: LOAD_INVOICES,
            data: invoices,
        })
    },

    loadCardDetails(cardDetails) {
        Dispatcher.dispatch({
            type: LOAD_CARD_DETAILS,
            data: cardDetails,
        })
    },

    sendUpdateCardDetailsSuccess(cardDetails) {
        Dispatcher.dispatch({
            type: UPDATE_CARD_DETAILS_SUCCESS,
            data: cardDetails,
        })
    },

    sendUpdateCardDetailsFailure(error) {
        Dispatcher.dispatch({
            type: UPDATE_CARD_DETAILS_FAILURE,
            error,
        })
    },
}

export const AccountActions = {
    updateSubscription(data) {
        Accounts.updateSubscription(data)
                .then(AccountServerActions.updateUserSubscriptionSuccess,
                    AccountServerActions.updateUserSubscriptionFailure)
    },

    updateAccountDetails(data) {
        Accounts.updateUser(data)
                .then(AccountServerActions.sendAccountUpdateSuccess, AccountServerActions.sendAccountUpdateFailure)
    },

    changeProfilePhoto(file) {
        Accounts.uploadPhoto(file)
                .then(AccountServerActions.sendProfilePhotoUpdateSuccess,
                    AccountServerActions.sendProfilePhotoUpdateFailure)
    },

    getInvoices() {
        Accounts.loadInvoices()
                .then(AccountServerActions.loadInvoices)
    },

    getCardDetails() {
        Accounts.getCardDetails()
                .then(AccountServerActions.loadCardDetails)
    },

    updateCardDetails(token) {
        Accounts.updateCardDetails(token)
                .then(AccountServerActions.sendUpdateCardDetailsSuccess,
                    AccountServerActions.sendUpdateCardDetailsFailure)
    },
}

export default AccountActions
