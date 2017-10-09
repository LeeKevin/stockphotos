import { EventEmitter } from 'events'
import Dispatcher from '../Dispatcher'
import { LOAD_INVOICES } from '../actions/AccountActions'
import { LOGOUT } from '../actions/AuthActions'


const CHANGE = 'CHANGE'
let invoices = []

class InvoiceStore extends EventEmitter {
    constructor() {
        super()

        this.dispatchToken = Dispatcher.register(this.dispatcher.bind(this))
        this.addChangeListener = callback => this.on(CHANGE, callback)
        this.removeChangeListener = callback => this.removeListener(CHANGE, callback)
        this.getInvoices = () => invoices
        this.getInvoice = id => invoices.find(i => i.id === id)
    }

    dispatcher(action) {
        switch (action.type) {
            case LOGOUT:
                invoices = []
                break
            case LOAD_INVOICES:
                invoices = action.data
                break
            default:
                return true
        }

        this.emit(CHANGE)
        return true
    }
}

export default new InvoiceStore()
