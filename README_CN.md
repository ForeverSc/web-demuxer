<h4 align="right"><a href="https://github.com/ForeverSc/web-demuxer/blob/main/README.md">English</a> | <strong>简体中文</strong></h4>
<h1 align="center">Web-Demuxer</h1>
<p align="center">使用WebAssembly在浏览器中对媒体文件进行解码, 专门为WebCodecs设计</p>

## Purpose
WebCodecs只提供了decode的能力，但没有提供demux的能力。有一些JS解封装mp4box.js很酷，但它只支持mp4，Web-Demuxer的目的是一次性支持更多媒体格式

## Features
- 🪄 专门为WebCodecs设计，API对于WebCodecs开发而言十分友好，可以轻松实现媒体文件的解封装
- 📦 一次性支持多种媒体格式，比如mov/mp4/mkv/webm/flv/m4v/wmv/avi等等
- 🧩 支持自定义打包，可以调整配置，打包出指定格式的demuxer

### Install
```bash
npm install web-demuxer
```

### Usage
```typescript
import { WebDemuxer } from "web-demuxer"

const demuxer = new WebDemuxer({
  wasmLoaderPath: "", // wasm file path
})

// 以获取指定时间点的视频帧为例
async function seek(time) {
  // 1. 加载视频文件
  await demuxer.load(file);

  // 2. 解封装视频文件并生成WebCodecs所需的VideoDecoderConfig和EncodedVideoChunk
  const videoDecoderConfig = await demuxer.getVideoDecoderConfig();
  const videoChunk = await demuxer.seekEncodedVideoChunk(seekTime);

  // 3. 通过WebCodecs去解码视频帧
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

### API
TODO

## License
MIT
