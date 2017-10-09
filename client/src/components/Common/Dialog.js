import React from 'react'
import ReactDOM from 'react-dom'
import Radium from 'radium'
import keycode from 'keycode'
import Overlay from './Overlay'
import RenderToLayer from './RenderToLayer'


const styles = {
    root: {
        position: 'fixed',
        boxSizing: 'border-box',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)', // Remove mobile color flashing (deprecated)
        zIndex: 1001,
        top: 0,
        left: '-101%',
        width: '100%',
        height: '100%',
        transition: 'left 0s cubic-bezier(0.23, 1, 0.32, 1) .4s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialog: {
        boxSizing: 'border-box',
        overflowY: 'auto',
        position: 'relative',
        borderRadius: 5,
        zIndex: 1002,
        opacity: 0,
        transition: 'opacity 300ms ease',
        animation: 'x 300ms',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animationName: Radium.keyframes({
            '0%': {
                transform: 'scale(0.6)',
            },
            '45%': {
                transform: 'scale(1.05)',
            },
            '80%': {
                transform: 'scale(0.95)',
            },
            '100%': {
                transform: 'scale(1)',
            },
        }, 'pop'),
    },
}

@Radium
class DialogInline extends React.Component {
    componentDidMount() {
        this.positionDialog()

        this.handleResize = this.handleResize.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)
        this.handleTouchTapOverlay = this.handleTouchTapOverlay.bind(this)
        this.requestClose = this.requestClose.bind(this)
        this.positionDialog = this.positionDialog.bind(this)

        window.addEventListener('resize', this.handleResize)
        window.addEventListener('keyup', this.handleKeyUp)
    }

    componentDidUpdate() {
        this.positionDialog()
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize)
        window.removeEventListener('keyup', this.handleKeyUp)
    }

    positionDialog() {
        const {
            open,
        } = this.props

        if (!open) {
            return
        }

        const clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
        // const container = ReactDOM.findDOMNode(this)
        // const dialogWindow = ReactDOM.findDOMNode(this.refs.dialogWindow)
        const dialogContent = ReactDOM.findDOMNode(this.dialog)
        // const minPaddingTop = 16

        // Reset the height in case the window was resized.
        // dialogWindow.style.height = ''
        dialogContent.style.height = ''

        // const dialogWindowHeight = dialogWindow.offsetHeight
        // let paddingTop = ((clientHeight - dialogWindowHeight) / 2) - 64
        // if (paddingTop < minPaddingTop) paddingTop = minPaddingTop

        // Vertically center the dialog window, but make sure it doesn't
        // transition to that position.
        // if (repositionOnUpdate || !container.style.paddingTop) {
        //     container.style.paddingTop = `${paddingTop}px`
        // }

        // Force a height if the dialog is taller than clientHeight
        const maxDialogContentHeight = clientHeight - (2 * 64)

        dialogContent.style.maxHeight = `${maxDialogContentHeight}px`
    }

    requestClose(buttonClicked) {
        if (!buttonClicked && this.props.modal) {
            return
        }

        if (this.props.onRequestClose) {
            this.props.onRequestClose(!!buttonClicked)
        }
    }

    handleTouchTapOverlay = () => {
        this.requestClose(false)
    }

    handleKeyUp = (event) => {
        if (keycode(event) === 'esc') {
            this.requestClose(false)
        }
    }

    handleResize = () => {
        this.positionDialog()
    }

    render() {
        const {
            show,
            children,
            style,
        } = this.props

        let root = styles.root,
            dialog = styles.dialog

        if (show) {
            root = {
                ...root,
                left: 0,
                transition: 'left 0s ease 0s',
            }
            dialog = {
                ...dialog,
                transition: 'opacity 200ms ease',
                opacity: 1,
            }
        }

        return <div style={root}>
            {
                show &&
                <div
                    ref={(el) => {
                        this.dialog = el
                    }}
                    style={dialog}
                >
                    <div style={{
                        borderRadius: 5,
                        backgroundColor: '#fff',
                        padding: 16,
                        maxWidth: '75%',
                        margin: '0 10px',
                        minWidth: 300,
                        minHeight: 300,
                        ...style,
                    }}>
                        {children}
                    </div>
                </div>
            }
            <Overlay show={show} onTouchTap={this.handleTouchTapOverlay}/>
        </div>
    }
}

export default class Dialog extends React.Component {
    static propTypes = {
        // Whether to show the Dialog
        show: React.PropTypes.bool,

        // Callback when the Dialog is closed (initiated from the Dialog). Returned with first argument closedByButton
        onRequestClose: React.PropTypes.func,

        // Whether the Dialog will persist (i.e. cannot be dismissed by ESC key or clicking
        // outside the Dialog)
        modal: React.PropTypes.bool,
    }

    constructor(props) {
        super(props)

        this.renderLayer = this.renderLayer.bind(this)
    }

    renderLayer() {
        return <DialogInline {...this.props}/>
    }

    render() {
        return <RenderToLayer render={this.renderLayer} open={true} useLayerForClickAway={false}/>
    }
}
