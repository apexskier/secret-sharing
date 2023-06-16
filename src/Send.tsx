import React from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  Textarea,
  useClipboard,
} from "@chakra-ui/react";
import { Await, useSuspensePromise } from "./Await";

export function Send({ rawKey }: { rawKey: string }) {
  const key = useSuspensePromise(
    React.useMemo(
      async () =>
        crypto.subtle.importKey(
          "spki",
          Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0)),
          { name: "RSA-OAEP", hash: { name: "SHA-384" } },
          false,
          ["encrypt"]
        ),
      [rawKey]
    )
  );
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
    },
    []
  );

  const [message, setMessage] = React.useState("");

  return (
    <>
      <React.Suspense fallback={<Text>Preparing key...</Text>}>
        <Await
          resource={key}
          onError={() => <Text>Key is invalid, get a new link</Text>}
        >
          {(key) => (
            <>
              <FormControl mb="3">
                <FormLabel>Secret</FormLabel>
                <InputGroup>
                  <Input
                    value={message}
                    onChange={handleChange}
                    placeholder="my-secret-text"
                    autoComplete="off"
                    autoCorrect="off"
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
              </FormControl>

              {message ? (
                <Box>
                  <EncryptedMessageContainer
                    publicKey={key}
                    message={message}
                  />
                </Box>
              ) : null}
            </>
          )}
        </Await>
      </React.Suspense>
    </>
  );
}

function EncryptedMessageContainer({
  publicKey,
  message,
}: {
  publicKey: CryptoKey;
  message: string;
}) {
  const encrypted = React.useMemo(async () => {
    const encoded = new TextEncoder().encode(message);
    const encrypted = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoded
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }, [message, publicKey]);
  return (
    <React.Suspense fallback={<Text>Encrypting...</Text>}>
      <Await
        resource={useSuspensePromise(encrypted)}
        onError={() => <Text>Error encrypting</Text>}
      >
        {(encrypted) => <EncryptedMessage payload={encrypted} />}
      </Await>
    </React.Suspense>
  );
}

function EncryptedMessage({ payload }: { payload: string }) {
  const { onCopy, hasCopied } = useClipboard(payload);
  return (
    <HStack justifyContent="space-between">
      <Box
        as="pre"
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        overflow="hidden"
        display="block"
      >
        {payload}
      </Box>
      <Button flexShrink="0" onClick={onCopy}>
        {hasCopied ? "Copied!" : "Copy"}
      </Button>
    </HStack>
  );
}
