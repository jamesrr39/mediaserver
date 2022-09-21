import React, { createContext } from "react";
import { Observable } from "ts-util/src/Observable";

export const ScrollResizeContext = React.createContext<Observable<void>>(null);

type WindowType = {
  innerHeight: number;
  innerWidth: number;
};

export const WindowContext = React.createContext<WindowType>(null);

export const GalleryContainerContext = createContext<HTMLElement>(null);
