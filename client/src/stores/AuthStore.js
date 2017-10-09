import { EventEmitter } from 'events'
import Dispatcher from '../Dispatcher'
import { LOAD_USER, LOGOUT, EMAIL_UNIQUE_RESULT, SIGNUP_FAILURE, SIGNUP_SUCCESS } from '../actions/AuthActions'
import { UPDATE_USER_SUBSCRIPTION_SUCCESS, USER_UPDATE_SUCCESS, PROFILE_PHOTO_SUCCESS } from '../actions/AccountActions'

let user = null

class AuthStore extends EventEmitter {
    constructor() {
        super()

        this.onLogin = this.onLogin.bind(this)
        this.onChangeUser = this.onLogin
        this.onLogout = this.onLogout.bind(this)
        this.onSignUpFailure = this.onSignUpFailure.bind(this)

        this.removeLoginListener = this.removeLoginListener.bind(this)
        this.removeUserListener = this.removeLoginListener
        this.removeLogoutListener = this.removeLogoutListener.bind(this)
        this.removeSignUpFailureListener = this.removeSignUpFailureListener.bind(this)

        this.getCurrentUser = () => user
        this.isUserSubscribed = () => user && (new Date(user.subscribed_until)) >= (new Date())

        this.dispatchToken = Dispatcher.register(this.dispatcher.bind(this))
    }

    onLogin(callback) {
        this.on(LOAD_USER, callback)
    }

    removeLoginListener(callback) {
        this.removeListener(LOAD_USER, callback)
    }

    onLogout(callback) {
        this.on(LOGOUT, callback)
    }

    onSignUpFailure(callback) {
        this.on(SIGNUP_FAILURE, callback)
    }

    removeLogoutListener(callback) {
        this.removeListener(LOGOUT, callback)
    }

    removeSignUpFailureListener(callback) {
        this.removeListener(SIGNUP_FAILURE, callback)
    }

    dispatcher(action) {
        switch (action.type) {
            case USER_UPDATE_SUCCESS:
            case SIGNUP_SUCCESS:
            case UPDATE_USER_SUBSCRIPTION_SUCCESS:
            case LOAD_USER:
                user = action.data
                this.emit(LOAD_USER)
                break
            case LOGOUT:
                user = null
                this.emit(LOGOUT, action.error)
                break
            case SIGNUP_FAILURE:
                user = null
                this.emit(SIGNUP_FAILURE, action.error)
                break
            case EMAIL_UNIQUE_RESULT:
                this.emit(EMAIL_UNIQUE_RESULT, !!action.data)
                break
            case PROFILE_PHOTO_SUCCESS:
                user = {
                    ...user,
                    picture: action.data,
                }
                this.emit(LOAD_USER)
                break
            default:
                return true
        }

        return true
    }

}

export default new AuthStore()
