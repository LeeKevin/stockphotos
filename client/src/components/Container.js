import React from 'react'
import Radium from 'radium'
import Nav from './Nav'

const styles = {
    body: {
        position: 'relative',
        margin: '0 auto',
        padding: 32,
    },
}

@Radium
export default class Container extends React.Component {
    render() {
        return (
            <div>
                <Nav />
                <div style={styles.body}>
                    {this.props.children}
                </div>
            </div>
        )
    }
}
