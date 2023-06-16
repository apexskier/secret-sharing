import React from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  ListItem,
  OrderedList,
  Text,
  useClipboard,
} from "@chakra-ui/react";
import { Await, useSuspensePromise } from "./Await";

const keyPromise = crypto.subtle.generateKey(
  {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: { name: "SHA-384" },
  },
  true,
  ["encrypt", "decrypt"]
);

const DecodingError = Symbol("decoding failure");
type DecodingError = typeof DecodingError;

const DecryptionError = Symbol("decryption failure");
type DecryptionError = typeof DecryptionError;

function Keypair({ keypair }: { keypair: CryptoKeyPair }) {
  const [message, _setMessage] = React.useState("");
  const url = React.useMemo(async () => {
    const exported = await crypto.subtle.exportKey("spki", keypair.publicKey);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    const url = new URL(location.origin);
    url.searchParams.set("key", base64);
    return url.toString();
  }, [keypair]);
  const [decrypted, setDecrypted] = React.useState<string | null>(null);
  const [decryptionError, setDecryptionError] = React.useState<
    DecodingError | DecryptionError | null
  >(null);
  const setMessage = React.useCallback((message: string) => {
    setDecryptionError(null);
    _setMessage(message);
  }, []);

  React.useEffect(() => {
    if (!message) {
      return;
    }
    (async () => {
      try {
        const binaryString = atob(message);
        const encoded = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
        try {
          const decrypted = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            keypair.privateKey,
            encoded
          );
          try {
            setDecrypted(new TextDecoder().decode(decrypted));
          } catch (error) {
            setDecryptionError(DecodingError);
          }
        } catch (error) {
          setDecryptionError(DecryptionError);
        }
      } catch (error) {
        setDecryptionError(DecodingError);
      }
    })();
  }, [keypair.privateKey, message]);

  return (
    <>
      <React.Suspense fallback={<Text>Exporting public key...</Text>}>
        <Await
          resource={useSuspensePromise(url)}
          onError={() => <Text>Error exporting public key</Text>}
        >
          {(url) => <ShareLink url={url} />}
        </Await>
      </React.Suspense>
      <FormControl isInvalid={!!decryptionError}>
        <FormLabel>Encrypted text</FormLabel>
        <InputGroup>
          <Input
            value={message}
            onChange={React.useCallback(
              (e: React.ChangeEvent<HTMLInputElement>) => {
                setMessage(e.target.value);
              },
              [setMessage]
            )}
          />
          <InputRightElement width="auto">
            <Button
              size="sm"
              onClick={React.useCallback(() => {
                navigator.clipboard.readText().then(setMessage);
              }, [setMessage])}
              mx="1"
            >
              Paste
            </Button>
          </InputRightElement>
        </InputGroup>

        <FormErrorMessage>
          <DecryptError error={decryptionError} />
        </FormErrorMessage>
      </FormControl>
      {decrypted ? <DecryptedMessage decrypted={decrypted} /> : null}
    </>
  );
}

function DecryptedMessage({ decrypted }: { decrypted: string }) {
  const { onCopy, hasCopied } = useClipboard(decrypted);
  return (
    <HStack justifyContent="space-between">
      <Text as="pre" whiteSpace="pre-wrap">
        {decrypted}
      </Text>
      <Button flexShrink="0" onClick={onCopy}>
        {hasCopied ? "Copied!" : "Copy"}
      </Button>
    </HStack>
  );
}

function DecryptError({
  error,
}: {
  error: DecryptionError | DecodingError | null;
}) {
  if (error === null) {
    return null;
  }
  if (error == DecodingError) {
    return "Failed to decode";
  }
  if (error == DecryptionError) {
    return "Failed to decrypt";
  }
  ensureNever(error);
}

function ensureNever(value: never): never {
  throw new Error("value not handled: " + value);
}

export function Request() {
  return (
    <>
      <React.Suspense fallback={<Text>Creating key...</Text>}>
        <Await
          resource={useSuspensePromise(keyPromise)}
          onError={(error) => <Text>Error creating key: {String(error)}</Text>}
        >
          {(keypair) => <Keypair keypair={keypair} />}
        </Await>
      </React.Suspense>
      <Instructions />
    </>
  );
}

function Instructions() {
  return (
    <Box backgroundColor="gray.200" borderRadius="xl" padding="6">
      <HStack justifyContent="space-around">
        <Text title="Alice" fontSize="5xl">
          👩🏾‍🌾
        </Text>
        <Text>needs a secret from</Text>
        <Text title="Bob" fontSize="5xl">
          👨🏻‍🎨
        </Text>
      </HStack>
      <OrderedList>
        <ListItem>
          <Text>
            <Text display="inline" title="Alice" fontSize="4xl">
              👩🏾‍🌾
            </Text>{" "}
            sends{" "}
            <Text display="inline" title="Bob" fontSize="4xl">
              👨🏻‍🎨
            </Text>{" "}
            the special link
          </Text>
        </ListItem>
        <ListItem>
          <Text>
            <Text display="inline" title="Bob" fontSize="4xl">
              👨🏻‍🎨
            </Text>{" "}
            enters the secret, and sends
            <Text display="inline" title="Alice" fontSize="4xl">
              👩🏾‍🌾
            </Text>{" "}
            the encrypted text
          </Text>
        </ListItem>
        <ListItem>
          <Text>
            <Text display="inline" title="Alice" fontSize="4xl">
              👩🏾‍🌾
            </Text>{" "}
            pastes the encrypted text and now has the secret!
          </Text>
        </ListItem>
      </OrderedList>
    </Box>
  );
}

function ShareLink({ url }: { url: string }) {
  const { onCopy, hasCopied } = useClipboard(url);
  return (
    <HStack justifyContent="space-between">
      <Box
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        overflow="hidden"
        display="block"
      >
        <Link target="_blank" href={url}>
          {url}
        </Link>
      </Box>
      <Button flexShrink="0" onClick={onCopy}>
        {hasCopied ? "Copied!" : "Copy"}
      </Button>
    </HStack>
  );
}
