import React from 'react'
import Radium from 'radium'
import moment from 'moment-timezone'
import numeral from 'numeral'
import { Link } from 'react-router'
import AccountActions from '../../actions/AccountActions'
import InvoiceStore from '../../stores/InvoiceStore'
import { EllipsesLoader } from '../Common'
import CommonStyles from '../../styles/CommonStyles'


const styles = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        borderSpacing: 0,
    },
    tableCell: {
        border: '1px solid #d7d7d7',
        padding: '8px 16px',
        textAlign: 'left',
    },
}

@Radium
export default class Invoices extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            invoices: InvoiceStore.getInvoices(),
        }

        this.loadInvoices = this.loadInvoices.bind(this)

        InvoiceStore.addChangeListener(this.loadInvoices)
        AccountActions.getInvoices()
    }

    loadInvoices() {
        this.setState({
            invoices: InvoiceStore.getInvoices(),
            invoicesLoaded: true,
        })
    }

    componentWillUnmount() {
        InvoiceStore.removeChangeListener(this.loadInvoices)
    }

    render() {
        const { invoices, invoicesLoaded } = this.state

        return <div>
            <h2 style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 16px 8px 0' }}>
                Your Payment History
            </h2>

            <div style={{ marginTop: 16 }}>
                {
                    invoices.length ?
                        <table style={styles.table}>
                            <thead>
                            <tr>
                                <th style={styles.tableCell}>Date</th>
                                <th style={styles.tableCell}>Payment</th>
                                <th style={styles.tableCell}>Status</th>
                                <th style={styles.tableCell}>Invoice</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                invoices.map((invoice, i) => <tr key={i}>
                                    <td style={styles.tableCell}>
                                        {moment(invoice.date, 'X').format('MMM D, YYYY')}
                                    </td>
                                    <td style={styles.tableCell}>
                                        ${numeral(invoice.total / 100).format('0.00')}
                                    </td>
                                    <td style={styles.tableCell}>
                                        {(!invoice.closed && 'Pending') || (invoice.paid && 'Paid') || 'Failed'}
                                    </td>
                                    <td style={styles.tableCell}>
                                        <div style={{ color: CommonStyles.mainColor }}>
                                            <Link to={`settings/invoices/${invoice.id}`}>View</Link>
                                        </div>
                                    </td>
                                </tr>)
                            }
                            </tbody>
                        </table> :
                        <div style={{ textAlign: 'center', padding: 8 }}>
                            { invoicesLoaded ? 'You have no invoices.' : <EllipsesLoader /> }
                        </div>
                }
            </div>
        </div>
    }
}
