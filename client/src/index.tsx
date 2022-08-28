import * as React from "react";
import * as ReactDOM from "react-dom/client";

import registerServiceWorker from "./registerServiceWorker";

import { Provider } from "react-redux";
import configureStore from "./configureStore";
import App from "./ui/App";
import { QueryClient, QueryClientProvider } from "react-query";
import { DebouncedObservable, Observable } from "ts-util/src/Observable";
import { ScrollResizeContext, WindowContext } from "./context/WindowContext";

// TODO use configureStore from redux toolkit
const store = configureStore();
const queryClient = new QueryClient();

// setup scroll/resize observable
const scrollResizeObservable = new DebouncedObservable<void>(150);
window.addEventListener("scroll", () => scrollResizeObservable.triggerEvent());
window.addEventListener("resize", () => {
  console.log("window:resize");
  scrollResizeObservable.triggerEvent();
});

const app = (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <ScrollResizeContext.Provider value={scrollResizeObservable}>
        <WindowContext.Provider value={window}>
          <App />
        </WindowContext.Provider>
      </ScrollResizeContext.Provider>
    </QueryClientProvider>
  </Provider>
);

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error(`couldn't find root element`);
}

ReactDOM.createRoot(rootEl).render(app);
registerServiceWorker();
