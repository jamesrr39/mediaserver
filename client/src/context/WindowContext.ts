import React from "react";
import { Observable } from "ts-util/dist/Observable";

export const ScrollResizeContext = React.createContext<Observable<void>>(null);

type WindowType = {
  innerHeight: number;
  innerWidth: number;
};

export const WindowContext = React.createContext<WindowType>(null);
