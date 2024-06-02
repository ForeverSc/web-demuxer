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
  wasmLoaderPath: "", // wasm file path
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
- [Seek Video Frame](https://foreversc.github.io/web-demuxer/#example-seek): [code](https://github.com/ForeverSc/web-demuxer/blob/main/index.html#L96)
- [Play Video](https://foreversc.github.io/web-demuxer/#example-play): [code](https://github.com/ForeverSc/web-demuxer/blob/main/index.html#L123)

## API
TODO

## License
MIT
