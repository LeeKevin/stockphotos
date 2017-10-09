import React from 'react'
import Radium from 'radium'
import { Link } from 'react-router'
import CommonStyles from '../../styles/CommonStyles'

export { default as Account } from './Account'
export { default as Subscription } from './Subscription'
export { default as Password } from './Password'
export { default as Invoices } from './Invoices'
export { default as Invoice } from './Invoice'
export { default as CreditCard } from './CreditCard'

const items = {
    account: '/settings/account',
    password: '/settings/password',
    subscription: '/settings/subscription',
    invoices: '/settings/invoices',
    card: '/settings/card',
}

const styles = {
    container: {
        display: 'flex',
        margin: '0 auto',
        maxWidth: 1000,
        flexWrap: 'wrap-reverse',
    },
    sidebar: {
        paddingRight: 48,
        marginTop: 8,
        '@media (max-width: 790px)': {
            flex: 1,
            paddingRight: 0,
        },
    },
    content: {
        flex: 1,
        marginBottom: 24,
        '@media (max-width: 790px)': {
            width: '100%',
            flex: 'none',
        },
    },

    subtitle: {
        fontWeight: 200,
        color: '#666',
        textTransform: 'uppercase',
        padding: '16px 0 8px',
    },

    menu: {
        padding: 0,
        margin: 0,
        listStyle: 'none',
    },

    menuItem: {
        display: 'block',
        padding: '8px 32px 8px 16px',
        marginBottom: 2,
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all .3s ease',
        whiteSpace: 'nowrap',
    },
    menuItem__hover: {
        backgroundColor: '#f7f7f7',
        color: CommonStyles.mainColor,
    },
    menuItem__selected: {
        backgroundColor: CommonStyles.mainColor,
        color: '#fff',
        cursor: 'default',
    },
}

@Radium
class MenuItem extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object.isRequired,
    }

    static propTypes = {
        label: React.PropTypes.string.isRequired,
        selected: React.PropTypes.bool,
        link: React.PropTypes.string.isRequired,
    }

    constructor(props) {
        super(props)

        this.onClick = this.onClick.bind(this)
        this.onMouseEnter = this.onMouseEnter.bind(this)
        this.onMouseLeave = this.onMouseLeave.bind(this)

        this.state = {
            hovered: false,
        }
    }

    render() {
        const { selected, label, link } = this.props
        const { hovered } = this.state
        let style = styles.menuItem

        if (selected) {
            style = { ...style, ...styles.menuItem__selected }
        } else if (hovered) {
            style = { ...style, ...styles.menuItem__hover }
        }

        return selected ? <li
                style={style}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}>
                {label}
            </li> : <Link to={link} style={style} onMouseEnter={this.onMouseEnter}
                          onMouseLeave={this.onMouseLeave}>{label}</Link>
    }

    onMouseEnter() {
        this.setState({
            hovered: true,
        })
    }

    onMouseLeave() {
        this.setState({
            hovered: false,
        })
    }

    onClick() {
        const { selected, link } = this.props

        if (selected) return

        this.context.router.push(link)
    }
}

@Radium
export class Settings extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props)

        this.state = {}
        this.styles = styles
    }

    render() {
        const selected = this.getCurrentItem()
        const styles = this.styles

        return <div style={styles.container}>
            <div style={styles.sidebar}>
                <h3>Settings</h3>
                <h4 style={styles.subtitle}>Profile</h4>
                <ul style={styles.menu}>
                    <MenuItem label="Account"
                              link={items.account}
                              selected={selected === items.account}/>
                    <MenuItem label="Password"
                              link={items.password}
                              selected={selected === items.password}/>
                </ul>
                <h4 style={styles.subtitle}>Subscription</h4>
                <ul style={styles.menu}>
                    <MenuItem label="My Subscription"
                              link={items.subscription}
                              selected={selected === items.subscription}/>
                </ul>
                <h4 style={styles.subtitle}>Billing</h4>
                <ul style={styles.menu}>
                    <MenuItem label="Invoices"
                              link={items.invoices}
                              selected={selected === items.invoices}/>
                    <MenuItem label="Credit Card"
                              link={items.card}
                              selected={selected === items.card}/>
                </ul>
            </div>
            <div style={styles.content}>
                {this.props.children}
            </div>
        </div>
    }

    getCurrentItem() {
        const item = Object.keys(items).find(key => this.context.router.isActive(items[key], true))

        if (item) {
            return items[item]
        }

        return ''
    }
}
