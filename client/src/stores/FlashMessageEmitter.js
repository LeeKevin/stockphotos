import { EventEmitter } from 'events'
import Dispatcher from '../Dispatcher'
import { UPDATE_USER_SUBSCRIPTION_SUCCESS } from '../actions/AccountActions'
import { SIGNUP_SUCCESS } from '../actions/AuthActions'

export const EMIT_MESSAGE = 'EMIT_MESSAGE'
const MESSAGE = 'MESSAGE'

class FlashMessageEmitter extends EventEmitter {
    constructor() {
        super()

        this.dispatchToken = Dispatcher.register(this.dispatcher.bind(this))
        this.addMessageListener = this.addMessageListener.bind(this)
        this.removeMessageListener = this.removeMessageListener.bind(this)
        this.emitMessage = this.emitMessage.bind(this)
    }

    addMessageListener(callback) {
        this.on(MESSAGE, callback)
    }

    removeMessageListener(callback) {
        this.removeListener(MESSAGE, callback)
    }

    emitMessage(message, isError = false) {
        this.emit(MESSAGE, message, isError)
    }

    dispatcher(action) {
        let message
        switch (action.type) {
            case SIGNUP_SUCCESS:
                message = signUpSuccessMessage(action.data)
                break
            case UPDATE_USER_SUBSCRIPTION_SUCCESS:
                message = updateSubscriptionSuccessMessage(action.data)
                break
            case EMIT_MESSAGE:
                message = action.message
                break
            default:
                return true
        }

        if (message) this.emitMessage(message)
        return true
    }
}

function signUpSuccessMessage(user) {
    let message = 'You have successfully signed up!'

    if (user.plan === 1) {
        message += ' Enjoy your Premium membership!'
    }

    return message
}

function updateSubscriptionSuccessMessage(user) {
    if (user.plan === 0) {
        return 'Your subscription was successfully downgraded to Free.'
    }

    if (user.plan === 1) {
        if (!user.will_auto_renew) {
            return 'You have successfully cancelled your Premium subscription.'
        }

        return 'Woohoo! You are now a Premium member!'
    }

    return null
}

export default new FlashMessageEmitter()
