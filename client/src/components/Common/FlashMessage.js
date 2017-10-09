import React from 'react'


function getStyles(props) {
    const { show, style, containerStyle } = props
    const maxHeight = (style && style.maxHeight) || 100

    return {
        container: {
            overflow: 'hidden',
            ...containerStyle,
            padding: (show && containerStyle && containerStyle.padding) || 0,
            margin: (show && containerStyle && containerStyle.margin) || 0,
            transition: 'all ease 0.4s',
        },
        message: {
            ...style,
            position: 'relative',
            maxHeight: show ? maxHeight : 0,
            padding: (show && style && style.padding) || 0,
            margin: (show && style && style.margin) || 0,
            opacity: show ? 1 : 0,
            visibility: show ? 'visible' : 'hidden',
            transform: show ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'paddingTop ease 0.4s, paddingBottom ease 0.4s, margin ease 0.4s, max-height ease 0.4s,' +
            ' transform ease 0.4s, opacity ease 0.2s',
        },
    }
}

class FlashMessage extends React.Component {
    static propTypes = {
        onHide: React.PropTypes.func.isRequired,
        show: React.PropTypes.bool,
        style: React.PropTypes.object,
        containerStyle: React.PropTypes.object,
        autoHideDuration: React.PropTypes.number,
    }

    static defaultProps = {
        show: false,
        autoHideDuration: 5000,
    }

    componentDidUpdate(prevProps) {
        if (prevProps.show !== this.props.show && this.props.show) {
            this.setAutoHideTimer()
        }
    }

    setAutoHideTimer() {
        const { autoHideDuration, show, onHide } = this.props
        if (autoHideDuration > 0) {
            clearTimeout(this.timerAutoHideId)
            this.timerAutoHideId = setTimeout(() => {
                if (show) {
                    onHide()
                }
            }, autoHideDuration)
        }
    }

    render() {
        const styles = getStyles(this.props),
            { onHide, children } = this.props

        return <div style={styles.container}>
            <div style={styles.message}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', }}>
                    <div style={{ flex: 1 }}>
                        {children}
                    </div>
                    <div onClick={onHide} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                        <i className="fa fa-times"/>
                    </div>
                </div>
            </div>
        </div>
    }
}

export default FlashMessage
