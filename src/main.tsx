import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { App } from "./App";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

const cache = createCache({
  key: "css",
  nonce: document.getElementById("csp-nonce")?.textContent ?? undefined,
});

const theme = extendTheme({
  config: {
    initialColorMode: "system",
    useSystemColorMode: true,
  },
  components: {
    Link: {
      baseStyle: {
        textDecoration: "underline",
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <CacheProvider value={cache}>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </CacheProvider>
  </React.StrictMode>
);
