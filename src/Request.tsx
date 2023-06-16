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
  Skeleton,
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
import { disabledCopy } from "./disabledCopy";
import React from "react";

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
  const [encryptedPayload, setEncryptedPayload] = React.useState("");
  const [error, setError] = React.useState<
    DecryptionError | DecodingError | Error | null
  >(null);

  const decryptedPromise = React.useMemo(async () => {
    if (!encryptedPayload) {
      return null;
    }
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
          return new TextDecoder().decode(decryptedMessage);
        } catch (error) {
          console.warn(error);
          throw DecodingError;
        }
      } catch (error) {
        console.warn(error);
        throw DecryptionError;
      }
    } catch (error) {
      console.warn(error);
      throw DecodingError;
    }
  }, [privateKey, encryptedPayload]);

  React.useEffect(() => {
    setError(null);
    decryptedPromise.catch(setError);
  }, [decryptedPromise]);

  return (
    <>
      <FormControl isInvalid={!!error}>
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
          <DecryptError error={error} />
        </FormErrorMessage>
      </FormControl>

      <FormControl>
        <FormLabel>Secret</FormLabel>
        <HStack justifyContent="space-between" alignItems="baseline">
          <Await
            promise={decryptedPromise}
            then={(decrypted) =>
              decrypted ? (
                <DecryptedMessage decrypted={decrypted} />
              ) : (
                decryptedPlaceholder
              )
            }
            catch={() => decryptedPlaceholder}
          >
            <Skeleton flex="1">
              <Box as="pre">Decrypting</Box>
            </Skeleton>
            {disabledCopy}
          </Await>
        </HStack>
      </FormControl>
    </>
  );
}

const decryptedPlaceholder = (
  <>
    <Text fontSize="sm">Once decrypted, the secret will display here.</Text>
    {disabledCopy}
  </>
);

function DecryptedMessage({ decrypted }: { decrypted: string }) {
  const { onCopy, hasCopied } = useClipboard(decrypted);
  return (
    <>
      <Text as="pre" whiteSpace="pre-wrap">
        {decrypted}
      </Text>
      <Button flexShrink="0" onClick={onCopy}>
        {hasCopied ? "Copied!" : "Copy"}
      </Button>
    </>
  );
}

function DecryptError({
  error,
}: {
  error: DecryptionError | DecodingError | Error | null;
}) {
  if (!error) {
    return null;
  }
  if (typeof error != "symbol") {
    throw error;
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
