/**
 * Jest polyfills that must run BEFORE the test environment is set up
 * and before any module imports.
 *
 * This file is loaded via jest.config.js setupFiles option.
 * Required for MSW 2.x compatibility with Jest.
 *
 * See: https://mswjs.io/docs/integrations/node#commonjs
 */

const { TextEncoder, TextDecoder } = require('util');
const { ReadableStream, TransformStream, WritableStream } = require('stream/web');

// Polyfill TextEncoder/TextDecoder for MSW
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill Web Streams API for MSW 2.x
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;
global.WritableStream = WritableStream;

// Polyfill BroadcastChannel for MSW 2.x (not available in Node.js)
class BroadcastChannelMock {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
    this.onmessageerror = null;
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}
global.BroadcastChannel = BroadcastChannelMock;
