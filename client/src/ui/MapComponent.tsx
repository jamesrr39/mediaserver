import * as React from "react";
import * as Leaflet from "leaflet";
import { RawSize } from "../domain/PictureMetadata";
import { MapLocation } from "../domain/Location";
import { escapeHtml } from "ts-util/dist/Html";
import { ActivityBounds, FitTrack } from "../domain/FitTrack";

import markerIcon from "../../node_modules/leaflet/dist/images/marker-icon.png";
import markerShadow from "../../node_modules/leaflet/dist/images/marker-shadow.png";
import { deepEqual } from "../util/equal";
import { joinUrlFragments } from "src/domain/util";

const StartIcon = Leaflet.Icon.extend({
  createIcon: () => {
    const el = document.createElement("div");
    el.style.width = "21px";
    el.style.height = "24px";
    el.style.marginTop = "-24px";
    el.style.marginLeft = "-10.5px";
    el.style.color = "#33aa66";

    const i = document.createElement("i");
    i.className = `fa fa-2x fa-play-circle`;
    el.appendChild(i);

    return el;
  },
});

const FinishIcon = Leaflet.Icon.extend({
  createIcon: () => {
    const el = document.createElement("div");
    el.style.width = "21px";
    el.style.height = "24px";
    el.style.marginTop = "-24px";
    el.style.color = "#33aa66";

    const i = document.createElement("i");
    i.className = `fa fa-2x fa-flag-checkered`;
    el.appendChild(i);

    return el;
  },
});

function addTrackToMap(
  track: TrackMapData,
  trackIndex: number,
  map: Leaflet.Map,
  onClickPoint: (point: Leaflet.LatLng) => void
) {
  const { selectedSection } = track;

  if (track.points.length === 0) {
    // track with 0 points cannot be plotted, and will also crash later on when we try to access the last element of the track points array
    return;
  }

  const beforePoints: Leaflet.LatLng[] = [];
  const selectedPoints: Leaflet.LatLng[] = [];
  const afterPoints: Leaflet.LatLng[] = [];

  track.points.forEach((point, recordIdx) => {
    const latLng = new Leaflet.LatLng(point.lat, point.lon);

    if (!selectedSection) {
      selectedPoints.push(latLng);
      return;
    }

    if (recordIdx < selectedSection.startIdx) {
      beforePoints.push(latLng);
      return;
    }

    if (recordIdx === selectedSection.startIdx) {
      beforePoints.push(latLng);
      selectedPoints.push(latLng);
      return;
    }

    if (recordIdx > selectedSection.endIdx) {
      afterPoints.push(latLng);
      return;
    }

    if (recordIdx === selectedSection.endIdx) {
      afterPoints.push(latLng);
      selectedPoints.push(latLng);
      return;
    }

    selectedPoints.push(latLng);
  });

  // background lines
  const backgroundColor = "#aaa";
  if (beforePoints.length > 0) {
    const beforePolyLine = createPolyLine(
      beforePoints,
      backgroundColor,
      onClickPoint
    );
    beforePolyLine.addTo(map);
  }

  if (afterPoints.length > 0) {
    const afterPolyLine = createPolyLine(
      afterPoints,
      backgroundColor,
      onClickPoint
    );
    afterPolyLine.addTo(map);
  }

  // main line
  const mainColor = generateColorFromIndex(trackIndex);

  const mainLine = createPolyLine(selectedPoints, mainColor, onClickPoint);
  mainLine.addTo(map);

  const firstRecord = track.points[0];
  const lastRecord = track.points[track.points.length - 1];
  const startMarker = Leaflet.marker(
    new Leaflet.LatLng(firstRecord.lat, firstRecord.lon),
    {
      icon: new StartIcon(),
    }
  );
  startMarker.addTo(map);

  const finishMarker = Leaflet.marker(
    new Leaflet.LatLng(lastRecord.lat, lastRecord.lon),
    {
      icon: new FinishIcon(),
    }
  );
  finishMarker.addTo(map);

  if (track.openTrackUrl) {
    const link = joinUrlFragments([
      "#",
      track.openTrackUrl,
      encodeURIComponent(track.trackSummary.hashValue),
    ]);

    startMarker.bindPopup(`<a href='${link}'>Track</a>`);
    startMarker.addEventListener("click", (event) => {
      startMarker.openPopup();
    });

    finishMarker.bindPopup(`<a href='${link}'>Track</a>`);
    finishMarker.addEventListener("click", (event) => {
      finishMarker.openPopup();
    });
  }
}

function createPolyLine(
  points: Leaflet.LatLng[],
  color: string,
  onClickPoint: (point: Leaflet.LatLng) => void
) {
  const polyLine = Leaflet.polyline(points, {
    color,
  });
  polyLine.on("mouseover", function (e) {
    var layer = e.target;

    layer.setStyle({
      color: "blue",
      opacity: 1,
      weight: 5,
    });
  });
  polyLine.on("mouseout", function (e) {
    var layer = e.target;

    layer.setStyle({
      color: "black",
      opacity: 1,
      weight: 5,
    });
  });

  polyLine.bindPopup("", {
    closeButton: false, // https://github.com/Leaflet/Leaflet/issues/1200
  });

  polyLine.on("popupopen", (e: Leaflet.PopupEvent) => {
    const popup = e.popup;
    const { lat, lng } = popup.getLatLng();
    const latFixedDec = lat.toFixed(4);
    const lngFixDec = lng.toFixed(4);
    const latDescriptor = lat >= 0 ? "N" : "S";
    const lngDescriptor = lng >= 0 ? "E" : "W";

    popup.setContent(
      `Coordinates: ${latFixedDec}${latDescriptor}, ${lngFixDec}${lngDescriptor}`
    );

    onClickPoint && onClickPoint(popup.getLatLng());
  });

  return polyLine;
}

function generateColorFromIndex(index: number): string {
  let color = (index * 16).toString(16);
  const paddingFieldsCount = 6 - color.length;
  const padding = "2".repeat(paddingFieldsCount);
  const colorCode = `#${padding}${color}`;

  return colorCode;
}

function getBounds(markers?: MapMarker[], tracks?: TrackMapData[]) {
  let n = -90;
  let e = -180;
  let s = 90;
  let w = 180;

  if (markers) {
    markers.forEach((marker) => {
      if (marker.location.lat > n) {
        n = marker.location.lat;
      }

      if (marker.location.lat < s) {
        s = marker.location.lat;
      }

      if (marker.location.lon > e) {
        e = marker.location.lon;
      }

      if (marker.location.lon < w) {
        w = marker.location.lon;
      }
    });
  }

  if (tracks) {
    tracks.forEach((track) => {
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
  name: string;
  imagePreviewUrl: string;
  linkUrl: string;
  pictureRawSize: RawSize;
};

export type MapMarker = {
  icon?: Leaflet.DivIcon;
  location: MapLocation;
  popupData?: PopupData;
};

export type SelectedSection = {
  startIdx: number;
  endIdx: number;
};

export type TrackMapData = {
  trackSummary: FitTrack;
  points: ({ idx: number } & MapLocation)[];
  activityBounds: ActivityBounds;
  openTrackUrl?: string; // ex: #/gallery/detail
  selectedSection?: SelectedSection;
};

type Props = {
  size: {
    width: string;
    height: string;
  };
  markers?: MapMarker[];
  tracks?: TrackMapData[];
  extraLatLongMapPadding?: number;
  zoomControl: boolean;
  onClickPoint?: (latLng: Leaflet.LatLng) => void;
};

class MapComponent extends React.Component<Props> {
  private map: Leaflet.Map | null = null;

  shouldComponentUpdate(nextProps: Props) {
    // TODO: better equality comparison
    const hasChanged = !deepEqual(this.props, nextProps);

    if (hasChanged) {
      console.log("MapComponent should update");
    }

    return hasChanged;
  }

  render() {
    const { size, markers, tracks } = this.props;

    return (
      <div style={size} ref={(el) => this.renderMap(el, markers, tracks)} />
    );
  }

  private renderMap = (
    element: HTMLElement | null,
    markers?: MapMarker[],
    tracks?: TrackMapData[]
  ) => {
    if (!element) {
      return;
    }

    console.log("renderMap", element);

    const { extraLatLongMapPadding, zoomControl, onClickPoint } = this.props;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const map = Leaflet.map(element, {
      zoomControl,
      scrollWheelZoom: zoomControl,
      touchZoom: zoomControl,
      dragging: zoomControl,
    });
    const osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution =
      'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
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
      tracks.forEach((track, index) =>
        addTrackToMap(track, index, map, onClickPoint)
      );
    }

    if (markers) {
      markers.forEach((marker) => {
        const { lat, lon } = marker.location;
        let icon = marker.icon;
        if (!icon) {
          icon = new Leaflet.Icon({
            iconUrl: markerIcon,
            shadowUrl: markerShadow,
            iconSize: [24, 36],
            iconAnchor: [12, 36],
          });
        }

        const leafletMarker = Leaflet.marker([lat, lon], {
          icon,
        }).addTo(map);

        if (marker.popupData) {
          leafletMarker.bindPopup(this.createPopupHtml(marker.popupData));

          leafletMarker.addEventListener("click", (event) => {
            leafletMarker.openPopup();
          });
        }
      });
    }

    this.map = map;
  };

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
  };
}

export function newDivIcon() {
  const myCustomColour = "#583470";

  const markerHtmlStyles = `
    background-color: ${myCustomColour};
    width: 3rem;
    height: 3rem;
    display: block;
    left: -1.5rem;
    top: -1.5rem;
    position: relative;
    border-radius: 3rem 3rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF`;

  const icon = Leaflet.divIcon({
    className: "my-custom-pin", // TODO needed?
    iconAnchor: [0, 24],
    // labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles}" />`,
  });

  return icon;
}

export default MapComponent;
