import * as React from "react";
import * as ReactDOM from "react-dom/client";

import registerServiceWorker from "./registerServiceWorker";

import { Provider } from "react-redux";
import configureStore from "./configureStore";
import App from "./ui/App";
import { QueryClient, QueryClientProvider } from "react-query";
import { DebouncedObservable } from "ts-util/src/Observable";
import { listenToWindowActions } from "./actions/windowActions";

const scrollObservable = new DebouncedObservable<void>(150);
const resizeObservable = new DebouncedObservable<void>(150);
const store = configureStore(window, scrollObservable, resizeObservable);
const queryClient = new QueryClient();

const app = (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Provider>
);

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error(`couldn't find root element`);
}

ReactDOM.createRoot(rootEl).render(app);
registerServiceWorker();
