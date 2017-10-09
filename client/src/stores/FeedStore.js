import { EventEmitter } from 'events'
import Dispatcher from '../Dispatcher'
import { LOAD_FEED } from '../actions/FeedActions'
import { LOGOUT } from '../actions/AuthActions'


const CHANGE_EVENT = 'change'

let feed = []

class FeedStore extends EventEmitter {
    constructor() {
        super()

        this.dispatchToken = Dispatcher.register(this.dispatcher.bind(this))
        this.addChangeListener = this.addChangeListener.bind(this)
        this.removeChangeListener = this.removeChangeListener.bind(this)
        this.emitChange = this.emitChange.bind(this)
        this.getFeed = () => feed
    }

    addChangeListener(callback) {
        this.on(CHANGE_EVENT, callback)
    }

    removeChangeListener(callback) {
        this.removeListener(CHANGE_EVENT, callback)
    }

    emitChange() {
        this.emit(CHANGE_EVENT)
    }

    dispatcher(action) {
        switch (action.type) {
            case LOGOUT:
                feed = []
                break
            case LOAD_FEED:
                feed = action.data
                break
            default:
                return true
        }

        this.emitChange()
        return true
    }
}

export default new FeedStore()
