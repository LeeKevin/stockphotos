import React from 'react'
import Radium from 'radium'
import { Link } from 'react-router'

const styles = {
    root: {
        border: '1px solid #CCC',
        borderRadius: 3,
        whiteSpace: 'nowrap',
        padding: '8px 24px',
        background: '#fff',
        color: '#888',
        textTransform: 'lowercase',
        position: 'relative',
    },
    menuItem: {
        cursor: 'pointer',
        padding: '4px 0',
        margin: '4px 0',
        display: 'block',
        ':hover': { color: '#333' },
    },
    triangle: {
        width: 10,
        height: 10,
        position: 'absolute',
        top: -6,
        right: 10,
        transform: 'rotate(45deg)',
        background: '#fff',
        borderLeft: '1px solid #CCC',
        borderTop: '1px solid #CCC',
    },
}


@Radium
export default class UserMenu extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object.isRequired,
    }

    static propTypes = {
        style: React.PropTypes.object,
    }

    render() {
        const { style } = this.props

        return <div style={{ ...styles.root, ...style }}>
            <div style={styles.triangle}/>
            <Link key="settings" to="/settings/account" style={styles.menuItem}>
                Settings
            </Link>
            <Link key="signout" to="/logout" style={styles.menuItem}>
                Sign out
            </Link>
        </div>
    }
}
