export const asymmetricKeyName = { name: "RSA-OAEP" } as const;

export const asymmetricKeyAlgorithm = {
  ...asymmetricKeyName,
  hash: { name: "SHA-384" },
} as const;

export const asymmetricKeyOptions = {
  ...asymmetricKeyAlgorithm,
  modulusLength: 2048,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
} as const;

export const exportedPublicKeyKeyFormat = "spki" as const;

export const wrappedKeyFormat = "raw" as const;

const symmetricKeyName = { name: "AES-CTR" } as const;

export const symmetricKeyOptions = {
  ...symmetricKeyName,
  length: 256,
} as const;

export const symmetricKeyEncryptionOptions = {
  ...symmetricKeyName,
  counter: new Uint8Array(16),
  length: 128,
} as const;
