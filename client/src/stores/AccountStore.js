import { EventEmitter } from 'events'
import Dispatcher from '../Dispatcher'
import {
    UPDATE_USER_SUBSCRIPTION_FAILURE,
    UPDATE_USER_SUBSCRIPTION_SUCCESS,
    USER_UPDATE_SUCCESS,
    USER_UPDATE_FAILURE,
    PROFILE_PHOTO_SUCCESS,
    PROFILE_PHOTO_FAILURE,
    UPDATE_CARD_DETAILS_SUCCESS,
    UPDATE_CARD_DETAILS_FAILURE
} from '../actions/AccountActions'
import AuthStore from './AuthStore'
import CardDetailsStore from './CardDetailsStore'

const SUCCESS = 'SUCCESS'
const FAILURE = 'FAILURE'


class AccountStore extends EventEmitter {
    constructor() {
        super()

        this.dispatchToken = Dispatcher.register(this.dispatcher.bind(this))
        this.addSuccessListener = callback => this.on(SUCCESS, callback)
        this.addFailureListener = callback => this.on(FAILURE, callback)
        this.removeSuccessListener = callback => this.removeListener(SUCCESS, callback)
        this.removeFailureListener = callback => this.removeListener(FAILURE, callback)
        this.emitSuccess = (...args) => this.emit(SUCCESS, ...args)
        this.emitFailure = (err, ...args) => this.emit(FAILURE, err, ...args)
    }

    dispatcher(action) {
        switch (action.type) {
            case PROFILE_PHOTO_FAILURE:
            case USER_UPDATE_FAILURE:
            case UPDATE_USER_SUBSCRIPTION_FAILURE:
            case UPDATE_CARD_DETAILS_FAILURE:
                this.emitFailure(action.data)
                break
            case UPDATE_CARD_DETAILS_SUCCESS:
                Dispatcher.waitFor([CardDetailsStore.dispatchToken])
                this.emitSuccess(action.data)
                break
            case PROFILE_PHOTO_SUCCESS:
            case USER_UPDATE_SUCCESS:
            case UPDATE_USER_SUBSCRIPTION_SUCCESS:
                Dispatcher.waitFor([AuthStore.dispatchToken])
                this.emitSuccess(action.data)
                break
            default:
                return true
        }

        return true
    }
}

export default new AccountStore()
