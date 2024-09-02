import { fromBase64, fromUtf8, toBase64, toUtf8 } from '@cosmjs/encoding'

/**
 * Encode JSON object as base64 string.
 */
export const encodeJsonToBase64 = (object: any) =>
  toBase64(toUtf8(JSON.stringify(object)))

/**
 * Decode base64 string into JSON object. If `fallbackToString` is true and
 * JSON parse fails, decoded string is returned.
 */
export const decodeJsonFromBase64 = (
  base64String?: string,
  fallbackToString = false
) => {
  if (base64String) {
    const jsonMessage = fromUtf8(fromBase64(base64String))
    try {
      if (jsonMessage) {
        return JSON.parse(jsonMessage)
      }
    } catch (err) {
      if (fallbackToString) {
        return jsonMessage
      }

      throw err
    }
  }
}

/**
 * Determine whether or not the data appears to be gzipped.
 *
 * Gzip's magic number is 0x1f 0x8b, meaning it will start with those two bytes.
 * Other data could also start with those two bytes, but it's unlikely.
 */
export const isGzipped = (data: Uint8Array) =>
  data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b

/**
 * Compress data with gzip.
 */
export const gzipCompress = async (data: Uint8Array): Promise<Uint8Array> => {
  const compressionStream = new CompressionStream('gzip')
  const writer = compressionStream.writable.getWriter()
  writer.write(data)
  writer.close()
  const compressedData = await new Response(
    compressionStream.readable
  ).arrayBuffer()
  return new Uint8Array(compressedData)
}

/**
 * Decompress data with gzip.
 */
export const gzipDecompress = async (data: Uint8Array): Promise<Uint8Array> => {
  const decompressionStream = new DecompressionStream('gzip')
  const writer = decompressionStream.writable.getWriter()
  writer.write(data)
  writer.close()
  const decompressedData = await new Response(
    decompressionStream.readable
  ).arrayBuffer()
  return new Uint8Array(decompressedData)
}
