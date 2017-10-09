import { EventEmitter } from 'events'
import Dispatcher from '../Dispatcher'
import { LOAD_MY_PHOTO_PACKS } from '../actions/PhotoPackActions'
import { LOGOUT } from '../actions/AuthActions'


const CHANGE = 'CHANGE'
let packs = []

class MyPhotoPackStore extends EventEmitter {
    constructor() {
        super()

        this.dispatchToken = Dispatcher.register(this.dispatcher.bind(this))
        this.addChangeListener = callback => this.on(CHANGE, callback)
        this.removeChangeListener = callback => this.removeListener(CHANGE, callback)
        this.getPhotoPacks = () => packs
    }

    dispatcher(action) {
        switch (action.type) {
            case LOGOUT:
                packs = []
                break
            case LOAD_MY_PHOTO_PACKS:
                packs = action.data
                break
            default:
                return true
        }

        this.emit(CHANGE)
        return true
    }
}

export default new MyPhotoPackStore()
