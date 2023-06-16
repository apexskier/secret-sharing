import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, Container } from "@chakra-ui/react";
import { Send } from "./Send";
import { Request } from "./Request";

const search = new URLSearchParams(location.search);

function Main() {
  const rawKey = search.get("key");
  if (rawKey) {
    return <Send rawKey={rawKey} />;
  }
  return <Request />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <Container>
        <Main />
      </Container>
    </ChakraProvider>
  </React.StrictMode>
);
