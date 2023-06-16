import React from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
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
  asymmetricKeyOptions,
  wrappedKeyFormat,
  exportedPublicKeyKeyFormat,
} from "./cryptoOptions";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "./arrayBufferToBase64";
import { Loading } from "./Loading";

const keyPromise = crypto.subtle.generateKey(asymmetricKeyOptions, true, [
  "wrapKey",
  "unwrapKey",
]);

const exportedKey = keyPromise.then(({ publicKey }) =>
  crypto.subtle.exportKey(exportedPublicKeyKeyFormat, publicKey)
);

const DecodingError = Symbol("decoding failure");
type DecodingError = typeof DecodingError;

const DecryptionError = Symbol("decryption failure");
type DecryptionError = typeof DecryptionError;

function DecryptionForm({ privateKey }: { privateKey: CryptoKey }) {
  const [encryptedPayload, _setEncryptedPayload] = React.useState("");
  const [decrypted, setDecrypted] = React.useState<string | null>(null);
  const [decryptionError, setDecryptionError] = React.useState<
    DecodingError | DecryptionError | null
  >(null);
  const setEncryptedPayload = React.useCallback((encryptedPayload: string) => {
    setDecryptionError(null);
    _setEncryptedPayload(encryptedPayload);
  }, []);

  React.useEffect(() => {
    if (!encryptedPayload) {
      return;
    }
    (async () => {
      try {
        const { message: base64Message, key: base64WrappedKey } = JSON.parse(
          atob(encryptedPayload)
        ) as { message: string; key: string };
        const wrappedKey = base64ToArrayBuffer(base64WrappedKey);
        const encryptedMessage = base64ToArrayBuffer(base64Message);
        try {
          const decryptedKey = await crypto.subtle.unwrapKey(
            wrappedKeyFormat,
            wrappedKey,
            privateKey,
            asymmetricKeyOptions,
            symmetricKeyOptions,
            false,
            ["decrypt"]
          );
          const decryptedMessage = await crypto.subtle.decrypt(
            symmetricKeyEncryptionOptions,
            decryptedKey,
            encryptedMessage
          );
          try {
            setDecrypted(new TextDecoder().decode(decryptedMessage));
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
  }, [privateKey, encryptedPayload]);

  return (
    <>
      <FormControl isInvalid={!!decryptionError}>
        <FormLabel>Encrypted message</FormLabel>
        <InputGroup>
          <Input
            value={encryptedPayload}
            onChange={React.useCallback(
              (e: React.ChangeEvent<HTMLInputElement>) => {
                setEncryptedPayload(e.target.value);
              },
              [setEncryptedPayload]
            )}
          />
          <InputRightElement width="auto">
            <Button
              size="sm"
              onClick={React.useCallback(() => {
                navigator.clipboard.readText().then(setEncryptedPayload);
              }, [setEncryptedPayload])}
              mx="1"
            >
              Paste
            </Button>
          </InputRightElement>
        </InputGroup>
        <FormHelperText>
          Paste the message you receive from the secret knower.
        </FormHelperText>
        <FormErrorMessage>
          <DecryptError error={decryptionError} />
        </FormErrorMessage>
      </FormControl>

      <FormControl>
        <FormLabel>Secret</FormLabel>
        {decrypted ? (
          <DecryptedMessage decrypted={decrypted} />
        ) : (
          <Text>Once decrypted, the secret will display here.</Text>
        )}
      </FormControl>
    </>
  );
}

function DecryptedMessage({ decrypted }: { decrypted: string }) {
  const { onCopy, hasCopied } = useClipboard(decrypted);
  return (
    <HStack justifyContent="space-between" alignItems="baseline">
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
    return "Failed to decode, ensure the message is copied correctly.";
  }
  if (error == DecryptionError) {
    return "Failed to decrypt, try sending a new link and be sure not to refresh this page.";
  }
  ensureNever(error);
}

function ensureNever(value: never): never {
  throw new Error("value not handled: " + value);
}

export function Request() {
  return (
    <>
      <Heading as="h3" fontSize="xl">
        You need a secret from someone…
      </Heading>
      <Text as="i">
        (If you have the secret, get a link from the person who needs it.)
      </Text>
      <PublicKey />
      <Await
        promise={keyPromise}
        catch={(error) => (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Failed to create keypair</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : String(error)}
            </AlertDescription>
          </Alert>
        )}
        then={(keypair) => <DecryptionForm privateKey={keypair.privateKey} />}
      >
        <Loading>Creating key</Loading>
      </Await>
    </>
  );
}

function PublicKey() {
  return (
    <Await
      promise={exportedKey}
      catch={(error) => (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Failed to export public key</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : String(error)}
          </AlertDescription>
        </Alert>
      )}
      then={(exportedKey) => <ShareLink exportedKey={exportedKey} />}
    >
      <Loading>Exporting key</Loading>
    </Await>
  );
}

function ShareLink({ exportedKey }: { exportedKey: ArrayBuffer }) {
  const url = React.useMemo(() => {
    const url = new URL(location.href);
    url.searchParams.set("key", arrayBufferToBase64(exportedKey));
    return url.toString();
  }, [exportedKey]);
  const { onCopy, hasCopied } = useClipboard(url);

  return (
    <FormControl>
      <FormLabel>Share this link</FormLabel>
      <HStack justifyContent="space-between">
        <Box
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          display="block"
        >
          <Link isExternal href={url}>
            {url}
          </Link>
        </Box>
        <Button flexShrink="0" onClick={onCopy}>
          {hasCopied ? "Copied!" : "Copy"}
        </Button>
      </HStack>
      <FormHelperText>
        Send this link to the person who knows the secret.{" "}
        <Text as="b">
          Keep this page open, you need it to read the message they'll send
          back.
        </Text>{" "}
        If you refresh, send a new link.
      </FormHelperText>
    </FormControl>
  );
}
