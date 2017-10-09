import React from 'react'

const AlertCircle = function (props) {
    const { style } = props

    return <svg viewBox="0 0 200 200"
                style={{
                    width: 88,
                    height: 88,
                    color: 'inherit',
                    ...style,
                    fill: 'currentcolor',
                    stroke: 'currentcolor',
                }}>
        <circle cx={100} cy={100} r={95} strokeWidth={10} fill="transparent" />
        <rect height={107} width={10} x={95} y={30} rx={4.5} ry={4.5} />
        <circle cx={100} cy={160.5} r={7} />
    </svg>
}

AlertCircle.propTypes = {
    style: React.PropTypes.object,
}

export default AlertCircle
