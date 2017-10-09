import { EventEmitter } from 'events'
import Dispatcher from '../Dispatcher'
import { FACEBOOK_SDK_LOADED } from '../actions/FacebookActions'


class FacebookStore extends EventEmitter {}

const store =  new FacebookStore()

store.dispatchToken = Dispatcher.register((action) => {
    switch (action.type) {
    case FACEBOOK_SDK_LOADED:
        store.emit(FACEBOOK_SDK_LOADED)
        break
    default:
        return true
    }

    return true
})

export default store
