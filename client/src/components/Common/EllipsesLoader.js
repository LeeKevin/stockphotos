import React from 'react'
import Radium from 'radium'


const bounce = Radium.keyframes({
    '0%': { transform: 'scale(0)' },
    '40%': { transform: 'scale(1.0)' },
    '80%': { transform: 'scale(0)' },
    '100%': { transform: 'scale(0)' },
}, 'ellipses-bounce')

const styles = {
    root: {
        textAlign: 'center',
        display: 'inline-block',
    },
    circle: {
        borderRadius: '100%',
        display: 'inline-block',
        animation: 'x 1.4s infinite ease-in-out both',
        animationName: bounce,
    },
}

@Radium
class EllipsesLoader extends React.Component {
    static propTypes = {
        style: React.PropTypes.object,
        width: React.PropTypes.number,
        color: React.PropTypes.string,
    }

    render() {
        const { style, width = 70, color = '#666' } = this.props

        const circleDimension = Math.floor(width / 5)
        const circleMargin = `0 ${Math.floor(width / 22)}px`

        return <div style={{ ...style, ...styles.root, width }}>
            <div key="circle1"
                 style={{
                     ...styles.circle,
                     animationDelay: '-0.32s',
                     backgroundColor: color,
                     width: circleDimension,
                     height: circleDimension,
                     margin: circleMargin,
                 }}/>
            <div key="circle2"
                 style={{
                     ...styles.circle,
                     animationDelay: '-0.16s',
                     backgroundColor: color,
                     width: circleDimension,
                     height: circleDimension,
                     margin: circleMargin,
                 }}/>
            <div key="circle3"
                 style={{
                     ...styles.circle,
                     backgroundColor: color,
                     width: circleDimension,
                     height: circleDimension,
                     margin: circleMargin,
                 }}/>
        </div>
    }
}

export default EllipsesLoader
