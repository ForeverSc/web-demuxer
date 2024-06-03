<h4 align="right"><strong>English</strong> | <a href="https://github.com/ForeverSc/web-demuxer/blob/main/README_CN.md">简体中文</a></h4>
<h1 align="center">Web-Demuxer</h1>
<p align="center">Demux media files in the browser using WebAssembly, designed for WebCodecs.</p>

## Purpose
WebCodecs only provide the ability to decode, but not to demux. mp4box.js is cool, but it only supports mp4 demux. Web-Demuxer aims to support as many multimedia formats as possible at once.

## Features
- 🪄 Specifically designed for WebCodecs, the API is very friendly for WebCodecs development, you can easily realize the media file demux.
- 📦 One-time support for a variety of media formats, such as mov/mp4/mkv/webm/flv/m4v/wmv/avi, etc.
- 🧩 Support for customized packaging, you can adjust the configuration, packaged in a specified format demuxer

## Install
```bash
npm install web-demuxer
```

## Usage
```typescript
import { WebDemuxer } from "web-demuxer"

const demuxer = new WebDemuxer({
  // ⚠️ you need to put the dist/wasm-files file in the npm package into a static directory like public
  // making sure that the js and wasm in wasm-files are in the same directory
  wasmLoaderPath: "https://cdn.jsdelivr.net/npm/web-demuxer@latest/dist/wasm-files/ffmpeg.js",
})

// Take the example of seeking a video frame at a specified point in time
async function seek(time) {
  // 1. load video file
  await demuxer.load(file);

  // 2. demux video file and generate WebCodecs needed VideoDecoderConfig and EncodedVideoChunk
  const videoDecoderConfig = await demuxer.getVideoDecoderConfig();
  const videoChunk = await demuxer.seekEncodedVideoChunk(seekTime);

  // 3. use WebCodecs to decode frame
  const decoder = new VideoDecoder({
    output: (frame) => {
      // draw frame...
      frame.close();
    },
    error: (e) => {
      console.error('video decoder error:', e);
    }
  });

  decoder.configure(videoDecoderConfig);
  decoder.decode(videoChunk);
  decoder.flush();
}
```

## Examples
- [Seek Video Frame](https://foreversc.github.io/web-demuxer/#example-seek) ｜ [code](https://github.com/ForeverSc/web-demuxer/blob/main/index.html#L96)
- [Play Video](https://foreversc.github.io/web-demuxer/#example-play) ｜ [code](https://github.com/ForeverSc/web-demuxer/blob/main/index.html#L123)

## API
### `WebDemuxer`
#### Constructor
Creates a new instance of `WebDemuxer`.

##### Parameters
- `options`: Required, configuration options
  - `wasmLoaderPath`: Required, the address of the JS loader file corresponding to the wasm (corresponds to `dist/wasm-files/ffmpeg.js` or `dist/wasm-files/ffmpeg-mini.js` in the npm package)
  > ⚠️ You need to ensure that the wasm and JS loader files are placed in the same accessible directory. The JS loader will request the wasm file in the same directory by default.

#### `load(file: File): Promise<boolean>`
Loads the file and waits for the wasm worker to load. You need to wait for the `load` method to succeed before calling subsequent methods.

##### Parameters
- `file: File`: Required, the `File` object to be processed

#### `getVideoDecoderConfig(): Promise<VideoDecoderConfig>`
Parses the video stream and obtains the `VideoDecoderConfig` of the file. The return value can be directly used as an input parameter for the `configure` method of `VideoDecoder`.

#### `getAudioDecoderConfig(): Promise<AudioDecoderConfig>`
Parses the audio stream and obtains the `AudioDecoderConfig` of the file. The return value can be directly used as an input parameter for the `configure` method of `AudioDecoder`.

#### `seekEncodedVideoChunk(timestamp: number): Promise<EncodedVideoChunk>`
Obtains the video data at the specified timestamp (defaults to the keyframe). The return value can be directly used as an input parameter for the `decode` method of `VideoDecoder`.

##### Parameters
- `timestamp: number`: Required, in seconds

#### `seekEncodedAudioChunk(timestamp: number): Promise<EncodedAudioChunk>`
Obtains the audio data at the specified timestamp. The return value can be directly used as an input parameter for the `decode` method of `AudioDecoder`.

##### Parameters
- `timestamp: number`: Required, in seconds

#### `readAVPacket(start: number, end: number, streamType?: AVMediaType, streamIndex?: number): ReadableStream<WebAVPacket>`
Returns a `ReadableStream` for streaming packet data.

#### `getAVStream(streamType?: AVMediaType, streamIndex?: number): Promise<WebAVStream>`
Obtains data from the specified stream in the file.

#### `getAVPacket(timestamp: number, streamType?: AVMediaType, streamIndex?: number): Promise<WebAVPacket>`
Obtains the data at the specified timestamp in the file.

### Convenience API
Semantic wrappers based on the basic API to simplify input parameters
TODO

## Custom Demuxer
TODO

## License
MIT
