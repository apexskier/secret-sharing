# Secret sharing

This is a static web app that can be used to securely share a secret with someone else.

Visit https://camlittle.com/secret-sharing/ to try it out and learn more.

The motivation for this is to allow sharing passwords or other secrets with maximum control. All cryptography is done in the browser and data doesn't leave except by you copying and pasting. This allows the involved parties to use whatever communication mechanism they want (email, slack, etc). Asymmetric cryptography means no confidential shared knowledge is required, all communication between parties is public or encrypted.

Since keys aren't stored, the main security risk is the actual encryption algorithm being broken.
