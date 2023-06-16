import React from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
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
  const [message, setMessage] = React.useState("");
  const pub = React.useMemo(async () => {
    const exported = await crypto.subtle.exportKey("spki", keypair.publicKey);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    const url = new URL(location.origin);
    url.searchParams.set("key", base64);
    return url;
  }, [keypair]);
  const [decrypted, setDecrypted] = React.useState<string | null>(null);
  const [decryptionError, setDecryptionError] = React.useState<
    DecodingError | DecryptionError | null
  >(null);

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
          resource={useSuspensePromise(pub)}
          onError={(error) => <Text>Error exporting public key</Text>}
        >
          {(key) => (
            <Link
              target="_blank"
              href={key.toString()}
              noOfLines={1}
              whiteSpace="pre-wrap"
            >
              {key.toString()}
            </Link>
          )}
        </Await>
      </React.Suspense>
      <FormControl isInvalid={!!decryptionError}>
        <FormLabel>Message</FormLabel>
        <InputGroup>
          <Input
            value={message}
            onChange={React.useCallback(
              (e: React.ChangeEvent<HTMLInputElement>) => {
                setDecryptionError(null);
                setMessage(e.target.value);
              },
              []
            )}
          />
          <InputRightElement width="auto">
            <Button
              size="sm"
              onClick={React.useCallback(() => {
                navigator.clipboard.readText().then(setMessage);
              }, [])}
              mx={"1"}
            >
              Paste
            </Button>
          </InputRightElement>
        </InputGroup>

        {decrypted ? (
          <Text as={"pre"} whiteSpace={"pre-wrap"}>
            {decrypted}
          </Text>
        ) : null}
        <FormErrorMessage>
          {decryptionError == DecodingError
            ? "Failed to decode"
            : decryptionError == DecryptionError
            ? "Failed to decrypt"
            : null}
        </FormErrorMessage>
      </FormControl>
    </>
  );
}

export function Request() {
  return (
    <React.Suspense fallback={<Text>Creating key...</Text>}>
      <Await
        resource={useSuspensePromise(keyPromise)}
        onError={(error) => <Text>Error creating key: {String(error)}</Text>}
      >
        {(keypair) => <Keypair keypair={keypair} />}
      </Await>
    </React.Suspense>
  );
}
