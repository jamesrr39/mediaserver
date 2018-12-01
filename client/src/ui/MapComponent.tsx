import * as React from 'react';
import * as Leaflet from 'leaflet';
import { RawSize } from '../domain/PictureMetadata';
import { MapLocation } from '../domain/Location';
import { escapeHtml } from '../util/html';
import { ActivityBounds, FitTrack } from '../domain/FitTrack';
import { joinUrlFragments } from 'src/util/url';

const markerIcon = require('../../node_modules/leaflet/dist/images/marker-icon.png');
const markerShadow = require('../../node_modules/leaflet/dist/images/marker-shadow.png');

const StartIcon = Leaflet.Icon.extend({
  createIcon: () => {
    const el = document.createElement('div');
    el.style.width = '21px';
    el.style.height = '24px';
    el.style.marginTop = '-24px';
    el.style.marginLeft = '-10.5px';
    el.style.color = '#33aa66';

    const i = document.createElement('i');
    i.className = `fa fa-2x fa-play-circle`;
    el.appendChild(i);

    return el;
  }
});

const FinishIcon = Leaflet.Icon.extend({
  createIcon: () => {
    const el = document.createElement('div');
    el.style.width = '21px';
    el.style.height = '24px';
    el.style.marginTop = '-24px';
    el.style.color = '#33aa66';

    const i = document.createElement('i');
    i.className = `fa fa-2x fa-flag-checkered`;
    el.appendChild(i);

    return el;
  }
});

function getBounds(markers?: MapMarker[], tracks?: TrackMapData[]) {
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

  if (tracks) {
    tracks.forEach(track => {
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
    });
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

export type TrackMapData = {
  trackSummary: FitTrack,
  points: MapLocation[],
  activityBounds: ActivityBounds,
  openTrackUrl?: string, // ex: #/gallery/detail
};

type Props = {
  size: {
    width: string,
    height: string,
  },
  markers?: MapMarker[],
  tracks?: TrackMapData[],
  extraLatLongMapPadding?: number,
};

export default class MapComponent extends React.Component<Props> {
  private map: Leaflet.Map | null = null;

  render() {
    const { size, markers, tracks } = this.props;

    return (<div style={size} ref={(el) => this.renderMap(el, markers, tracks)} />);
  }

  private renderMap = (element: HTMLElement|null, markers?: MapMarker[], tracks?: TrackMapData[]) => {
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

    const bounds = getBounds(markers, tracks);
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

    if (tracks) {
      tracks.forEach((track, index) => {
        if (track.points.length === 0) {
          return;
        }

        const points = track.points.map(point => {
          return new Leaflet.LatLng(point.lat, point.long);
        });

        const color = `#${(index * 3).toString(16).substring(0, 1).repeat(3)}`;

        // tslint:disable-next-line
        console.log(color);

        Leaflet.polyline(points, {
          color,
        }).addTo(map);

        const startMarker = Leaflet.marker(points[0], {
          icon: new StartIcon(),
        });
        startMarker.addTo(map);

        const finishMarker = Leaflet.marker(points[points.length - 1], {
          icon: new FinishIcon(),
        });
        finishMarker.addTo(map);
        
        if (track.openTrackUrl) {
          const link = joinUrlFragments('#', track.openTrackUrl, track.trackSummary.hashValue);

          startMarker.bindPopup(`<a href='${link}'>Track</a>`);
          startMarker.addEventListener('click', (event) => {
            startMarker.openPopup();
          });

          finishMarker.bindPopup(`<a href='${link}'>Track</a>`);
          finishMarker.addEventListener('click', (event) => {
            finishMarker.openPopup();
          });
        }
      });
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
