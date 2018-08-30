import * as React from 'react';
import * as Leaflet from 'leaflet';
import { PictureMetadata, Location } from '../domain/PictureMetadata';

// import '../images/marker-icon.png';
// import '../images/shadow-icon.png';

type Props = {
  pictureMetadata: PictureMetadata;
};

const styles = {
  mapContainer: {
    width: '400px',
    height: '400px',
  },
};

class PictureInfoComponent extends React.Component<Props> {
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

  /* view-source:https://leafletjs.com/examples/quick-start/example.html */
  private renderMap = (element: HTMLElement|null, location: Location) => {
    if (element === null) {
      return;
    }
    if (element.children.length > 0) {
      return;
    }

    const map = Leaflet.map(element);
    const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const osmAttrib = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    const osm = new Leaflet.TileLayer(osmUrl, {
      minZoom: 8, maxZoom: 12, attribution: osmAttrib
    });

    map.setView(new Leaflet.LatLng(location.lat, location.long), 12);
    map.addLayer(osm);

    const marker = Leaflet.marker([60.432870, 6.850745], {
//       {
//     iconUrl: icon,
//     shadowUrl: iconShadow
// });
      icon: new Leaflet.Icon({
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/shadow-icon.png',
      })
    });
    // marker.icon()
    marker.addTo(map);
  }
}

export default PictureInfoComponent;
