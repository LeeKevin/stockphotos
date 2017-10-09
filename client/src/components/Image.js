import React from 'react'

// const isRetina = window.devicePixelRatio > 1

let images = []

class Image extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            visible: false,
            style: {
                backgroundColor: '#EEE',
                maxWidth: '100%',
                margin: '24px 0',
                width: props.width,
            },
        }

        this.setVisible = this.setVisible.bind(this)
        images.push(this)

        this.resizeImage = this.resizeImage.bind(this)
        window.addEventListener('resize', this.resizeImage)
    }

    setVisible() {
        this.setState({
            visible: true,
        })
    }

    resizeImage(cb) {
        const { style } = this.state

        let callback
        if (typeof cb === 'function') callback = cb

        if (style.width !== this.pseudo.clientWidth) {
            const { width, height } = this.props

            this.setState({
                style: {
                    ...style,
                    width: this.pseudo.clientWidth,
                    height: height * (this.pseudo.clientWidth / width),
                },
            }, callback)
        }
    }

    componentDidMount() {
        this.resizeImage(checkImages)
    }

    componentWillUnmount() {
        const index = images.indexOf(this)

        if (index > -1) {
            images.splice(index, 1)
        }

        window.removeEventListener('resize', this.resizeImage)
    }


    render() {
        const { placeholderUrl, url } = this.props,
            { visible, style } = this.state

        return <div>
            <img
                ref={(el) => {
                    this.node = el
                }}
                src={visible ? url : placeholderUrl}
                style={style}/>
            <div
                ref={(el) => {
                    this.pseudo = el
                }}
                style={{ height: 0, width: '100%', }}/>
        </div>
    }
}

Image.propTypes = {
    placeholderUrl: React.PropTypes.string,
    url: React.PropTypes.string.isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
}

function checkImages() {
    images = images.filter((image) => {
        if (!(image instanceof Image)) return false
        if (!image.node) return true

        const rect = image.node.getBoundingClientRect(),
            viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight),
            isVisible = !(rect.bottom < 0 || rect.top - viewHeight >= 0)

        if (isVisible) {
            image.setVisible()
            return false
        }

        return true
    })
}

window.addEventListener('scroll', checkImages)
window.addEventListener('resize', checkImages)


export default Image
