import * as React from 'react';
import { MediaFile } from '../../domain/MediaFile';
import { joinUrlFragments } from '../../util/url';
import { SERVER_BASE_URL } from '../../configs';
import { Link } from 'react-router-dom';

export const styles = {
    navigationButton: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '2em',
        width: '50px',
        height: '50px',
        lineHeight: '50px',
        align: 'center',
        verticalAlign: 'middle',
        backgroundColor: 'transparent',
        borderStyle: 'none',
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
    },
};

type Props = {
    mediaFile: MediaFile;
    baseUrl: string;
    onInfoButtonClicked: () => void;
};

export default class extends React.Component<Props> {
    render() {
        const {
            mediaFile: pictureMetadata, baseUrl, onInfoButtonClicked
        } = this.props;

        const pictureURL = joinUrlFragments(SERVER_BASE_URL, 'file', 'picture', pictureMetadata.hashValue);

        return (
        <div style={styles.topBar}>
            <Link to={baseUrl} style={styles.navigationButton}>&#x274C;</Link>
            {pictureMetadata.getName()}
            <div>
            <button
                onClick={onInfoButtonClicked}
                style={styles.navigationButton}
                className="fa fa-info-circle"
                aria-label="Info"
            />
            <a
                href={pictureURL}
                download={encodeURIComponent(pictureMetadata.getName())}
                style={styles.navigationButton}
                className="fa fa-download"
                aria-label="Download"
            />
            </div>
        </div>
        );
    }
}
