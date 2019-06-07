import * as React from 'react';
import { PictureMetadata } from '../../domain/PictureMetadata';
import { SERVER_BASE_URL } from '../../configs';
import { joinUrlFragments } from '../../util/url';
import { Size } from '../../domain/Size';
import { THUMBNAIL_HEIGHTS } from '../../generated/thumbnail_sizes';

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
        const { size, pictureMetadata } = this.props;

        if (!this.state.isLoaded) {
            const style = {
                width: size.width + 'px',
                height: size.height + 'px',
                backgroundColor: '#ddd',
            };
            return <div style={style}></div>;
        }

        let thumbnailHeight = THUMBNAIL_HEIGHTS.find((height) => {
            return (height >= size.height);
        });
        if (!thumbnailHeight) {
            thumbnailHeight = pictureMetadata.rawSize.height;
        }

        const imgSrc = joinUrlFragments(
            SERVER_BASE_URL,
            'picture',
            `${pictureMetadata.hashValue}?h=${thumbnailHeight}`
        );

        const style = {
            width: size.width + 'px',
            height: size.height + 'px',
            backgroundImage: `url(${imgSrc})`,
            backgroundSize: 'cover',
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