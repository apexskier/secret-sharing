import { Send } from "./Send";
import { Request } from "./Request";
import {
  Button,
  Container,
  Heading,
  Icon,
  Link,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  OrderedList,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";

const search = new URLSearchParams(location.search);

export function App() {
  const rawKey = search.get("key");
  const {
    isOpen: isExplainerOpen,
    onOpen: openExplainer,
    onClose: closeExplainer,
  } = useDisclosure();

  return (
    <Container p="6">
      <VStack spacing="4" alignItems="stretch">
        <Heading>Share secrets safely</Heading>
        {rawKey ? <Send rawKey={rawKey} /> : <Request />}
        <VStack as="footer" fontSize="sm" textAlign="center" mt="6">
          <Text>
            No data is stored or sent outside of this page. You are in full
            control.
          </Text>
          <Button variant="link" onClick={openExplainer}>
            How it works
          </Button>
          <Text>
            Built by{" "}
            <Link isExternal href="https://camlittle.com">
              Cameron Little
            </Link>
          </Text>
        </VStack>
      </VStack>

      <Modal isOpen={isExplainerOpen} onClose={closeExplainer}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>How this works</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="5">
            <VStack spacing="2">
              <OrderedList spacing="2">
                <ListItem>
                  An asymmetric keypair (a{" "}
                  <Text as="span" color="green.600">
                    public
                  </Text>{" "}
                  and{" "}
                  <Text as="span" color="yellow.600">
                    private
                  </Text>{" "}
                  key) is generated by the requestor
                  <Text as="span" aria-hidden="true">
                    {" "}
                    👩🏾‍🌾
                  </Text>
                  . The{" "}
                  <Text as="span" color="green.600">
                    public key
                  </Text>{" "}
                  is encoded into the link used by the sender
                  <Text as="span" aria-hidden="true">
                    {" "}
                    👨🏻‍🎨
                  </Text>
                  .
                </ListItem>
                <ListItem>
                  A{" "}
                  <Text as="span" color="cyan.600">
                    symmetric encryption key
                  </Text>{" "}
                  is generated by the sender
                  <Text as="span" aria-hidden="true">
                    {" "}
                    👨🏻‍🎨
                  </Text>
                  .
                </ListItem>
                <ListItem>
                  The sender
                  <Text as="span" aria-hidden="true">
                    {" "}
                    👨🏻‍🎨
                  </Text>{" "}
                  uses the{" "}
                  <Text as="span" color="cyan.600">
                    symmetric key
                  </Text>{" "}
                  to encrypt their{" "}
                  <Text as="span" color="red.600">
                    secret
                  </Text>{" "}
                  and wraps the{" "}
                  <Text as="span" color="cyan.600">
                    symmetric key
                  </Text>{" "}
                  with the{" "}
                  <Text as="span" color="green.600">
                    public key
                  </Text>
                  .
                </ListItem>
                <ListItem>
                  The requestor
                  <Text as="span" aria-hidden="true">
                    {" "}
                    👩🏾‍🌾
                  </Text>{" "}
                  unwraps the{" "}
                  <Text as="span" color="cyan.600">
                    symmetric key
                  </Text>{" "}
                  with their{" "}
                  <Text as="span" color="yellow.600">
                    private key
                  </Text>{" "}
                  and decrypts the{" "}
                  <Text as="span" color="red.600">
                    secret
                  </Text>{" "}
                  with the{" "}
                  <Text as="span" color="cyan.600">
                    symmetric key
                  </Text>
                  .
                </ListItem>
              </OrderedList>
              <Text>
                The intermediate symmetric encryption key is needed because the
                asymmetric key can only encrypt short messages.
              </Text>
              <Text>
                This is implemented with the{" "}
                <Link isExternal href="https://w3c.github.io/webcrypto/">
                  Web Cryptography API
                </Link>
                . No data (including secrets, encrypted content, and keys) is
                persisted or sent externally, except by you copying it.
              </Text>
              <Link
                isExternal
                href="https://github.com/apexskier/secret-sharing"
              >
                Source code
                <Icon
                  verticalAlign="text-bottom"
                  ml="2"
                  color="black"
                  _dark={{ color: "white" }}
                >
                  <path
                    fill="currentColor"
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                  />
                </Icon>
              </Link>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
