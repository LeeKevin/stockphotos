import React from 'react'
import Radium from 'radium'
import moment from 'moment-timezone'
import numeral from 'numeral'
import AccountActions from '../../actions/AccountActions'
import InvoiceStore from '../../stores/InvoiceStore'
import AuthStore from '../../stores/AuthStore'
import CommonStyles from '../../styles/CommonStyles'

const styles = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        borderSpacing: 0,
        margin: '24px 0',
    },
    tableHeader: {
        padding: '8px 16px',
        textAlign: 'left',
        backgroundColor: CommonStyles.mainColor,
        color: '#fff',
        borderBottom: '1px solid #f7f7f7',
    },
    tableCell: {
        padding: '8px 16px',
        textAlign: 'left',
    },
}

@Radium
export default class Invoice extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props)

        this.state = {
            invoice: InvoiceStore.getInvoice(this.props.params.id),
        }

        this.loadInvoices = this.loadInvoices.bind(this)

        InvoiceStore.addChangeListener(this.loadInvoices)
        AccountActions.getInvoices()
    }

    loadInvoices() {
        const invoice = InvoiceStore.getInvoice(this.props.params.id)

        if (!invoice) {
            this.context.router.replace('/') // 404
        }

        this.setState({
            invoice,
        })
    }

    componentDidMount() {
        window.print()
    }

    componentWillUnmount() {
        InvoiceStore.removeChangeListener(this.loadInvoices)
    }

    render() {
        const { invoice } = this.state

        if (!invoice) {
            return <div className="spinner-container">
                <div className="spinner"></div>
            </div>
        }

        const user = AuthStore.getCurrentUser()

        let invoiceId = invoice.id
        if (invoiceId.slice(0, 3) === 'in_') {
            invoiceId = invoiceId.slice(3)
        }

        return <div style={{ padding: '16px 32px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <h1 className="montserrat" style={{ flex: 1, fontSize: 40, paddingBottom: 16 }}>
                    Stockphotos
                </h1>
                <div>
                    <h2 contentEditable
                        suppressContentEditableWarning
                        style={{ fontWeight: 400, whiteSpace: 'nowrap' }}>
                        Invoice ID: {invoiceId.slice(0, 12)}
                    </h2>
                    <h3 contentEditable
                        suppressContentEditableWarning
                        style={{ fontSize: 18, fontWeight: 400, whiteSpace: 'nowrap', margin: '16px 0' }}>
                        Date: {moment(invoice.date, 'X').format('MMM D, YYYY')}
                    </h3>
                </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 16 }}>To:</h4>
                    <div contentEditable
                         suppressContentEditableWarning
                         style={{ margin: '8px 0' }}>
                        {user.full_name}
                    </div>
                    <div contentEditable
                         suppressContentEditableWarning
                         style={{ margin: '8px 0' }}>
                        {user.email}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 16 }}>From:</h4>
                    <div style={{ margin: '8px 0' }}>
                        Stockphotos
                    </div>
                    <p contentEditable
                       suppressContentEditableWarning
                       style={{ margin: '8px 0', lineHeight: 1.3 }}>
                        202 S 13th St
                        <br />
                        San Jose, CA, 95112
                        <br />
                        United States
                    </p>
                </div>
            </div>

            <div>
                <table style={styles.table}>
                    <thead>
                    <tr>
                        <th style={styles.tableHeader}>Description</th>
                        <th style={styles.tableHeader}>Price</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        invoice.lines.data.map((line, i) => <tr key={i} contentEditable suppressContentEditableWarning>
                            <td style={{ ...styles.tableCell, backgroundColor: i % 2 === 0 ? '#e7e7e7' : '#f7f7f7' }}>
                                {line.plan.name} Subscription
                                ({moment(line.period.start, 'X').format('MMM D, YYYY')} to {moment(line.period.end, 'X')
                                .format('MMM D, YYYY')})
                            </td>
                            <td style={{ ...styles.tableCell, backgroundColor: i % 2 === 0 ? '#e7e7e7' : '#f7f7f7' }}>
                                ${numeral(line.amount / 100).format('0.00')}
                            </td>
                        </tr>)
                    }
                    </tbody>
                </table>
                <div style={{ textAlign: 'right', fontSize: 16 }}>
                    <b>Total:</b> ${numeral(invoice.total / 100).format('0.00')} {invoice.currency.toUpperCase()}
                </div>
            </div>
        </div>
    }
}
