import { EventEmitter } from 'events'
import Dispatcher from '../Dispatcher'
import { LOAD_CARD_DETAILS, UPDATE_CARD_DETAILS_SUCCESS } from '../actions/AccountActions'
import { LOGOUT } from '../actions/AuthActions'


const CHANGE = 'CHANGE'
let card = {}

class CardDetailsStore extends EventEmitter {
    constructor() {
        super()

        this.dispatchToken = Dispatcher.register(this.dispatcher.bind(this))
        this.addChangeListener = callback => this.on(CHANGE, callback)
        this.removeChangeListener = callback => this.removeListener(CHANGE, callback)
        this.getCardDetails = () => card
    }

    dispatcher(action) {
        switch (action.type) {
            case LOGOUT:
                card = {}
                break
            case UPDATE_CARD_DETAILS_SUCCESS:
            case LOAD_CARD_DETAILS:
                card = action.data
                break
            default:
                return true
        }

        this.emit(CHANGE)
        return true
    }
}

export default new CardDetailsStore()
