import React from 'react'


let originalBodyOverflow = null
let lockingCounter = 0

class AutoLockScrolling extends React.Component {
    static propTypes = {
        lock: React.PropTypes.bool.isRequired,
    }

    componentDidMount() {
        if (this.props.lock === true) {
            this.preventScrolling()
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.lock !== nextProps.lock) {
            if (nextProps.lock) {
                this.preventScrolling()
            } else {
                this.allowScrolling()
            }
        }
    }

    componentWillUnmount() {
        this.allowScrolling()
    }

    // force to only lock/unlock once
    locked = false;

    preventScrolling() {
        if (this.locked === true) {
            return
        }

        lockingCounter += 1
        this.locked = true

        // only lock the first time the component is mounted.
        if (lockingCounter === 1) {
            const body = document.getElementsByTagName('body')[0]
            originalBodyOverflow = body.style.overflow
            body.style.overflow = 'hidden'
        }
    }

    allowScrolling() {
        if (this.locked === true) {
            lockingCounter -= 1
            this.locked = false
        }

        if (lockingCounter === 0 && originalBodyOverflow !== null) {
            const body = document.getElementsByTagName('body')[0]
            body.style.overflow = originalBodyOverflow || ''
            originalBodyOverflow = null
        }
    }

    render() {
        return null
    }
}

class Overlay extends React.Component {
    static propTypes = {
        show: React.PropTypes.bool,
    }

    render() {
        const {
            show,
            style,
            ...other,
        } = this.props

        const overlayStyle = {
            position: 'fixed',
            height: '100%',
            width: '100%',
            top: 0,
            left: show ? 0 : '-100%',
            opacity: show ? 0.4 : 0,
            backgroundColor: '#000',
            WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)', // Remove mobile color flashing (deprecated)

            // Two ways to promote overlay to its own render layer
            willChange: 'opacity',
            transform: 'translateZ(0)',

            transition: `opacity .4s ease, ${show ? 'left 0s ease 0s' : 'left 0s cubic-bezier(0.23, 1, 0.32, 1) .4s'}`,
            zIndex: 1000,
            ...style,
        }

        return <div {...other} style={overlayStyle}>
            <AutoLockScrolling lock={!!show}/>
        </div>
    }
}

export default Overlay
