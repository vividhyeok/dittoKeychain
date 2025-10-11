import { compressToEncodedURIComponent as compress, decompressFromEncodedURIComponent as decompress } from 'lz-string';

export const encodePayload = (payload: any): string => {
  const json = JSON.stringify(payload);
  return compress(json);
};

export const decodePayload = (encoded: string): any => {
  const json = decompress(encoded);
  if (!json) throw new Error('Invalid encoded data');
  return JSON.parse(json);
};