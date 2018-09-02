import * as React from 'react';
import * as Leaflet from 'leaflet';
import { PictureMetadata } from '../domain/PictureMetadata';
import { Location } from '../domain/PictureMetadata';
import { SMALL_SCREEN_WIDTH } from '../util/screen_size';

const markerIcon = require('../../node_modules/leaflet/dist/images/marker-icon.png');
const markerShadow = require('../../node_modules/leaflet/dist/images/marker-shadow.png');

export const INFO_CONTAINER_WIDTH = SMALL_SCREEN_WIDTH;

const styles = {
  mapContainer: {
    width: `${INFO_CONTAINER_WIDTH}px`,
    height: `${INFO_CONTAINER_WIDTH}px`,
  },
};

type Props = {
  pictureMetadata: PictureMetadata;
};

class PictureInfoComponent extends React.Component<Props> {
  private map: Leaflet.Map | null = null;

  render() {
    const { pictureMetadata } = this.props;

    const dateTaken = pictureMetadata.getTimeTaken();
    const timeTakenText = dateTaken ? dateTaken.toUTCString() : 'Unknown Date';
    const location = pictureMetadata.getLocation();
    const mapContainer = (location !== null)
      ? <div style={styles.mapContainer} ref={(el) => this.renderMap(el, location)} />
      : <p>No Location Data available</p>;

    return (
      <div>
        <p>{pictureMetadata.getName()}</p>
        <p>{timeTakenText}</p>
        {mapContainer}
      </div>
    );
  }

  private renderMap = (element: HTMLElement|null, location: Location) => {
    if (element === null) {
      return;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const map = Leaflet.map(element);
    const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    const osm = new Leaflet.TileLayer(osmUrl, {
      attribution,
    });

    map.setView(new Leaflet.LatLng(location.lat, location.long), 13);
    map.addLayer(osm);

    const marker = Leaflet.marker([location.lat, location.long], {
      icon: new Leaflet.Icon({
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [24, 36],
        iconAnchor: [12, 36],
      }),
    });

    marker.addTo(map);
    this.map = map;
  }

}

export default PictureInfoComponent;
