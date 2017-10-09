import ColorUtils from '../utils/ColorUtils'


const Main = {
    mainColor: '#00b1b3',
    facebookColor: '#4c66a4',
    errorColor: '#D65A5A',
    successColor: '#A5DC86',
}

const Settings = {
    input: {
        WebkitAppearance: 'none',
        alignItems: 'center',
        border: '1px solid #d7d7d7',
        borderRadius: 3,
        fontSize: 15,
        justifyContent: 'flex-start',
        lineHeight: '24px',
        display: 'block',
        outline: 0,
        cursor: 'pointer',
        margin: 0,
        width: '100%',
        backgroundColor: '#fff',
        padding: '4px 24px 4px 16px',
        ':hover': {
            border: '1px solid #a7a7a7',
        },
        ':focus': {
            border: `1px solid ${Main.mainColor}`,
            outline: 0,
        },
    },
}

export default {
    ...Main,
    formButton(color) {
        return {
            margin: '16px 0 0',
            padding: '12px 16px',
            border: '2px solid currentcolor',
            color,
            borderRadius: 3,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            textAlign: 'center',
            transition: 'all .2s ease',
        }
    },
    solidButton(color) {
        const hover = ColorUtils.shadeBlendConvert(-0.05, color)
        const active = ColorUtils.shadeBlendConvert(-0.15, color)

        return {
            outline: 0,
            border: 'none',
            display: 'inline-block',
            padding: '12px 24px',
            color: '#fff',
            backgroundColor: color,
            borderRadius: 3,
            textAlign: 'center',
            transition: 'all .2s ease',
            cursor: 'pointer',
            userSelect: 'none',
            ':hover': {
                backgroundColor: hover,
            },
            ':active': {
                backgroundColor: active,
            },
        }
    },
    Settings,
}
