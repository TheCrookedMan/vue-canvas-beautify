import {
  MIME_TYPE_JPEG
} from './constants'
const {
  fromCharCode
} = String;

/**
 * Get string from char code in data view.
 * @param {DataView} dataView - The data view for read.
 * @param {number} start - The start index.
 * @param {number} length - The read length.
 * @returns {string} The read result.
 */
export function getStringFromCharCode(dataView, start, length) {
  let str = '';

  length += start;

  for (let i = start; i < length; i += 1) {
    str += fromCharCode(dataView.getUint8(i));
  }

  return str;
}
/**
 * Get orientation value from given array buffer.
 * @param {ArrayBuffer} arrayBuffer - The array buffer to read.
 * @returns {number} The read orientation value.
 */
export function resetAndGetOrientation(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  let orientation;

  // Ignores range error when the image does not have correct Exif information
  try {
    let littleEndian;
    let app1Start;
    let ifdStart;

    // Only handle JPEG image (start by 0xFFD8)
    if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
      const length = dataView.byteLength;
      let offset = 2;

      while (offset + 1 < length) {
        if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
          app1Start = offset;
          break;
        }

        offset += 1;
      }
    }

    if (app1Start) {
      const exifIDCode = app1Start + 4;
      const tiffOffset = app1Start + 10;

      if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
        const endianness = dataView.getUint16(tiffOffset);

        littleEndian = endianness === 0x4949;

        if (littleEndian || endianness === 0x4D4D /* bigEndian */ ) {
          if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
            const firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);

            if (firstIFDOffset >= 0x00000008) {
              ifdStart = tiffOffset + firstIFDOffset;
            }
          }
        }
      }
    }

    if (ifdStart) {
      const length = dataView.getUint16(ifdStart, littleEndian);
      let offset;
      let i;

      for (i = 0; i < length; i += 1) {
        offset = ifdStart + (i * 12) + 2;

        if (dataView.getUint16(offset, littleEndian) === 0x0112 /* Orientation */ ) {
          // 8 is the offset of the current tag's value
          offset += 8;

          // Get the original orientation value
          orientation = dataView.getUint16(offset, littleEndian);

          // Override the orientation with its default value
          dataView.setUint16(offset, 1, littleEndian);
          break;
        }
      }
    }
  } catch (error) {
    orientation = 1;
  }

  return orientation;
}

export function createObjectURL(object) {
  return (window.URL) ? window.URL.createObjectURL(object) : window.webkitURL.createObjectURL(object);
}

export function ajax(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // xhr.onprogress = () => {
        //   if (xhr.getResponseHeader('content-type') !== MIME_TYPE_JPEG) {
        //     xhr.abort();
        //   }
        // };

        xhr.onload = () => {
          resolve(xhr.response);
        };

        xhr.onabort = (err)=>{
            reject(err)
        };
        xhr.onerror = (err) => {
          reject(err)
        };
        xhr.ontimeout = (err) => {
          reject(err)
        };

        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';
        // xhr.withCredentials = element.crossOrigin === 'use-credentials';
        xhr.send();
    })
}

const REGEXP_DATA_URL_HEAD = /^data:.*,/;

/**
 * Transform Data URL to array buffer.
 * @param {string} dataURL - The Data URL to transform.
 * @returns {ArrayBuffer} The result array buffer.
 */
export function dataURLToArrayBuffer(dataURL) {
  const base64 = dataURL.replace(REGEXP_DATA_URL_HEAD, '');
  const binary = atob(base64);
  const arrayBuffer = new ArrayBuffer(binary.length);
  const uint8 = new Uint8Array(arrayBuffer);

  forEach(uint8, (value, i) => {
    uint8[i] = binary.charCodeAt(i);
  });

  return arrayBuffer;
}

/**
 * Transform array buffer to Data URL.
 * @param {ArrayBuffer} arrayBuffer - The array buffer to transform.
 * @param {string} mimeType - The mime type of the Data URL.
 * @returns {string} The result Data URL.
 */
export function arrayBufferToDataURL(arrayBuffer, mimeType) {
  const chunks = [];

  // Chunk Typed Array for better performance (#435)
  const chunkSize = 8192;
  let uint8 = new Uint8Array(arrayBuffer);

  while (uint8.length > 0) {
    // XXX: Babel's `toConsumableArray` helper will throw error in IE or Safari 9
    // eslint-disable-next-line prefer-spread
    chunks.push(fromCharCode.apply(null, toArray(uint8.subarray(0, chunkSize))));
    uint8 = uint8.subarray(chunkSize);
  }

  return `data:${mimeType};base64,${btoa(chunks.join(''))}`;
}
const {
  slice
} = Array.prototype;

/**
 * Convert array-like or iterable object to an array.
 * @param {*} value - The value to convert.
 * @returns {Array} Returns a new array.
 */
export function toArray(value) {
  return Array.from ? Array.from(value) : slice.call(value);
}
/**
 * Parse Exif Orientation value.
 * @param {number} orientation - The orientation to parse.
 * @returns {Object} The parsed result.
 */
export function parseOrientation(orientation) {
  let rotate = 0;
  let scaleX = 1;
  let scaleY = 1;

  switch (orientation) {
    // Flip horizontal
    case 2:
      scaleX = -1;
      break;

      // Rotate left 180°
    case 3:
      rotate = -180;
      break;

      // Flip vertical
    case 4:
      scaleY = -1;
      break;

      // Flip vertical and rotate right 90°
    case 5:
      rotate = 90;
      scaleY = -1;
      break;

      // Rotate right 90°
    case 6:
      rotate = 90;
      break;

      // Flip horizontal and rotate right 90°
    case 7:
      rotate = 90;
      scaleX = -1;
      break;

      // Rotate left 90°
    case 8:
      rotate = -90;
      break;

    default:
  }

  return {
    rotate,
    scaleX,
    scaleY,
  };
}