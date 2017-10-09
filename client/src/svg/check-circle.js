import React from 'react'

const CheckCircle = function (props) {
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
        <circle cx={100} cy={100} r={95} strokeWidth={10} fill="transparent"/>
        <rect height={55} width={10} transform="rotate(-45 5 57.25)" x={3} y={120} rx={4.5} ry={4.5}/>
        <rect height={100} width={10} transform="rotate(45 57.25 5)" x={165} y={-20} rx={4.5} ry={4.5}/>
    </svg>
}

CheckCircle.propTypes = {
    style: React.PropTypes.object,
}

export default CheckCircle
