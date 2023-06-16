import React from "react";
import ReactDOM from "react-dom/client";
import {
  Box,
  ChakraProvider,
  Container,
  HStack,
  Heading,
  ListItem,
  OrderedList,
  Text,
  VStack,
} from "@chakra-ui/react";
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
      <Container p="6">
        <Heading mb="6">Share secrets safely</Heading>
        <Main />
        <Text fontSize="sm" mt="6">
          No data is stored in or sent from the browser. You are in full control
          of your data.
        </Text>
      </Container>
    </ChakraProvider>
  </React.StrictMode>
);
