import React from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  useClipboard,
} from "@chakra-ui/react";
import { Await } from "./Await";
import {
  symmetricKeyEncryptionOptions,
  symmetricKeyOptions,
  asymmetricKeyName,
  asymmetricKeyAlgorithm,
  wrappedKeyFormat,
  exportedPublicKeyKeyFormat,
} from "./cryptoOptions";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "./arrayBufferToBase64";
import { Loading } from "./Loading";

export function Send({ rawKey }: { rawKey: string }) {
  const symmetricKeyPromise = React.useMemo(
    async () =>
      window.crypto.subtle.generateKey(symmetricKeyOptions, true, [
        "encrypt",
        "decrypt",
      ]),
    []
  );
  const wrappedKeyPromise = React.useMemo(async () => {
    const [publicKey, symmetricKey] = await Promise.all([
      crypto.subtle.importKey(
        exportedPublicKeyKeyFormat,
        base64ToArrayBuffer(rawKey),
        asymmetricKeyAlgorithm,
        false,
        ["wrapKey"]
      ),
      symmetricKeyPromise,
    ]);
    return crypto.subtle.wrapKey(
      wrappedKeyFormat,
      symmetricKey,
      publicKey,
      asymmetricKeyName
    );
  }, [rawKey, symmetricKeyPromise]);
  const [message, setMessage] = React.useState("");
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
    },
    []
  );

  return (
    <>
      <Heading as="h3" fontSize="xl">
        Someone needs a secret from you!
      </Heading>
      <Text as="i">
        (If you need a secret, you can <Link href="/">request one here</Link>.)
      </Text>
      <FormControl>
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
        <FormHelperText>Enter the secret you want to share.</FormHelperText>
      </FormControl>
      <Await
        promise={wrappedKeyPromise}
        catch={() => (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Invalid Key</AlertTitle>
            <AlertDescription>
              This link isn't working, request a new one.
            </AlertDescription>
          </Alert>
        )}
        then={(wrappedKey) => (
          <Await
            promise={symmetricKeyPromise}
            catch={(error) => (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Failed to create encryption key</AlertTitle>
                <AlertDescription>
                  {error instanceof Error ? error.message : String(error)}
                </AlertDescription>
              </Alert>
            )}
            then={(symmetricKey) => (
              <EncryptedMessageContainer
                symmetricKey={symmetricKey}
                wrappedKey={wrappedKey}
                message={message}
              />
            )}
          >
            <Loading>Preparing encryption key</Loading>
          </Await>
        )}
      >
        <Loading>Parsing key from URL</Loading>
      </Await>
    </>
  );
}

function EncryptedMessageContainer({
  wrappedKey,
  symmetricKey,
  message,
}: {
  wrappedKey: ArrayBuffer;
  symmetricKey: CryptoKey;
  message: string;
}) {
  const encrypted = React.useMemo(async () => {
    const encryptedMessage = await crypto.subtle.encrypt(
      symmetricKeyEncryptionOptions,
      symmetricKey,
      new TextEncoder().encode(message)
    );
    return JSON.stringify({
      message: arrayBufferToBase64(encryptedMessage),
      key: arrayBufferToBase64(wrappedKey),
    });
  }, [message, symmetricKey, wrappedKey]);

  return (
    <Await
      promise={encrypted}
      catch={(error) => (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Failed to encrypt</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : String(error)}
          </AlertDescription>
        </Alert>
      )}
      then={(payload) => (
        <EncryptedMessage payload={payload} isDisabled={!message} />
      )}
    >
      <Loading>Encrypting</Loading>
    </Await>
  );
}

function EncryptedMessage({
  payload,
  isDisabled,
}: {
  payload: string;
  isDisabled: boolean;
}) {
  const { onCopy, hasCopied } = useClipboard(payload);

  return (
    <FormControl>
      <FormLabel>️Encrypted text</FormLabel>
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
        <Button flexShrink="0" onClick={onCopy} isDisabled={isDisabled}>
          {hasCopied ? "Copied!" : "Copy"}
        </Button>
      </HStack>
      <FormHelperText>
        Share this text with the person requesting the secret. They are the only
        person who will be able to decrypt it.
      </FormHelperText>
    </FormControl>
  );
}
