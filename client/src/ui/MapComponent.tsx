import * as React from 'react';
import * as Leaflet from 'leaflet';
import { RawSize } from '../domain/PictureMetadata';
import { Location } from '../domain/Location';
import { escapeHtml } from '../util/html';

const markerIcon = require('../../node_modules/leaflet/dist/images/marker-icon.png');
const markerShadow = require('../../node_modules/leaflet/dist/images/marker-shadow.png');

function getBounds(markers: MapMarker[]) {
  let n = -90;
  let e = -180;
  let s = 90;
  let w = 180;

  markers.forEach(marker => {
    if (marker.location.lat > n) {
      n = marker.location.lat;
    }

    if (marker.location.lat < s) {
      s = marker.location.lat;
    }

    if (marker.location.long > e) {
      e = marker.location.long;
    }

    if (marker.location.long < w) {
      w = marker.location.long;
    }
  });

  return {
    n,
    e,
    s,
    w,
  };
}

export type PopupData = {
  name: string,
  imagePreviewUrl: string,
  linkUrl: string,
  pictureRawSize: RawSize,
};

export type MapMarker = {
  location: Location,
  popupData?: PopupData,
};

type Props = {
  size: {
    width: string,
    height: string,
  },
  markers: MapMarker[],
  extraLatLongMapPadding?: number,
};

export default class MapComponent extends React.Component<Props> {
  private map: Leaflet.Map | null = null;

  render() {
    const { size, markers } = this.props;

    return (<div style={size} ref={(el) => this.renderMap(el, markers)} />);
  }

  private renderMap = (element: HTMLElement|null, markers: MapMarker[]) => {
    if (element === null) {
      return;
    }

    const { extraLatLongMapPadding } = this.props;

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

    const bounds = getBounds(markers);
    if (extraLatLongMapPadding) {
      bounds.n += extraLatLongMapPadding;
      bounds.s -= extraLatLongMapPadding;
      bounds.e += extraLatLongMapPadding;
      bounds.w -= extraLatLongMapPadding;
    }

    map.fitBounds(
      new Leaflet.LatLngBounds(
        new Leaflet.LatLng(bounds.s, bounds.w),
        new Leaflet.LatLng(bounds.n, bounds.e)
      )
    );
    map.addLayer(osm);

    markers.forEach(marker => {
      const { lat, long } = marker.location;

      const leafletMarker = Leaflet.marker([lat, long], {
        icon: new Leaflet.Icon({
          iconUrl: markerIcon,
          shadowUrl: markerShadow,
          iconSize: [24, 36],
          iconAnchor: [12, 36],
        }),
      })
      .addTo(map);

      if (marker.popupData) {
        leafletMarker.bindPopup(this.createPopupHtml(marker.popupData));

        leafletMarker.addEventListener('click', (event) => {
          leafletMarker.openPopup();
        });
      }
    });
    this.map = map;
  }

  private createPopupHtml = (popupData: PopupData) => {
    const { name, imagePreviewUrl, linkUrl } = popupData;

    const style = `
      background-image: url('${escapeHtml(imagePreviewUrl)}?h=100');
      width: 100px;
      height: 100px;
      background-repeat: no-repeat;
      background-position: center center;
    `;

    return `
      <div>
        ${escapeHtml(name)}
        <br />
        <a href="${escapeHtml(linkUrl)}">
          <div style="${style}"></div>
        </a>
      </div>
    `;
  }
}
