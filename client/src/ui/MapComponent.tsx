import * as React from 'react';
import * as Leaflet from 'leaflet';
import { RawSize } from '../domain/PictureMetadata';
import { MapLocation } from '../domain/Location';
import { escapeHtml } from '../util/html';
import { ActivityBounds } from '../domain/FitTrack';

const markerIcon = require('../../node_modules/leaflet/dist/images/marker-icon.png');
const markerShadow = require('../../node_modules/leaflet/dist/images/marker-shadow.png');

function getBounds(markers?: MapMarker[], track?: TrackMapData) {
  let n = -90;
  let e = -180;
  let s = 90;
  let w = 180;

  if (markers) {
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
  }

  if (track) {
    if (track.activityBounds.latMax > n) {
      n = track.activityBounds.latMax;
    }

    if (track.activityBounds.latMin < s) {
      s = track.activityBounds.latMin;
    }

    if (track.activityBounds.longMax > e) {
      e = track.activityBounds.longMax;
    }

    if (track.activityBounds.longMin < w) {
      w = track.activityBounds.longMin;
    }
  }

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
  location: MapLocation,
  popupData?: PopupData,
};

type TrackMapData = {
  points: MapLocation[],
  activityBounds: ActivityBounds,
};

type Props = {
  size: {
    width: string,
    height: string,
  },
  markers?: MapMarker[],
  track?: TrackMapData,
  extraLatLongMapPadding?: number,
};

export default class MapComponent extends React.Component<Props> {
  private map: Leaflet.Map | null = null;

  render() {
    const { size, markers, track } = this.props;

    return (<div style={size} ref={(el) => this.renderMap(el, markers, track)} />);
  }

  private renderMap = (element: HTMLElement|null, markers?: MapMarker[], track?: TrackMapData) => {
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

    const bounds = getBounds(markers, track);
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

    if (track) {
      const points = track.points.map(point => {
        return new Leaflet.LatLng(point.lat, point.long);
      });

      Leaflet.polyline(points).addTo(map);
    }

    if (markers) {
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
    }

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
