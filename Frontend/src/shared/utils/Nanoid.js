/**
 * Tiny nanoid-compatible ID generator.
 * Generates URL-safe random IDs like 'V1StGXR8_Z5jdHi6B-myT'
 * Used for client-generated canvas element IDs.
 */

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

export const nanoid = (size = 21) => {
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += ALPHABET[bytes[i] & 63];
  }
  return id;
};