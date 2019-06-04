import * as React from 'react';
import { PictureMetadata } from '../../domain/PictureMetadata';
import { SERVER_BASE_URL } from '../../configs';
import { joinUrlFragments } from '../../util/url';
import { Size } from '../../domain/Size';

type Props = {
    pictureMetadata: PictureMetadata,
    size: Size,
};

type ComponentState = {
    isLoaded: boolean
};

export class PictureThumbnail extends React.Component<Props, ComponentState> {
    state = {
        isLoaded: false,
    };

    render() {
        if (!this.state.isLoaded) {
            return null;
        }

        const { size, pictureMetadata } = this.props;

        const imgSrc = joinUrlFragments(SERVER_BASE_URL, 'picture', `${pictureMetadata.hashValue}?h=${size.height}`);

        const style = {
            width: size.width + 'px',
            height: size.height + 'px',
            backgroundImage: `url(${imgSrc})`,
        };

        return <div style={style} />;
    }
    componentDidMount() {
        const { size, pictureMetadata } = this.props;

        const imgSrc = joinUrlFragments(SERVER_BASE_URL, 'picture', `${pictureMetadata.hashValue}?h=${size.height}`);

        const image = new Image();
        image.onload = () => {
            this.setState(state => ({
            ...state,
            isLoaded: true,
            }));
        };
        image.src = imgSrc;
    }
    triggerInView() {
        // no-op
    }

}