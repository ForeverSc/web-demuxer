<h4 align="right"><a href="https://github.com/ForeverSc/web-demuxer/blob/main/README.md">English</a> | <strong>简体中文</strong></h4>
<h1 align="center">Web-Demuxer</h1>
<p align="center">使用WebAssembly在浏览器中对媒体文件进行解封装, 专门为WebCodecs设计</p>

## 目的
WebCodecs只提供了decode的能力，但没有提供demux的能力。有一些JS解封装mp4box.js很酷，但它只支持mp4，Web-Demuxer的目的是一次性支持更多媒体格式

## 特征
- 🪄 专门为WebCodecs设计，API对于WebCodecs开发而言十分友好，可以轻松实现媒体文件的解封装
- 📦 一次性支持多种媒体格式，比如mov/mp4/mkv/webm/flv/m4v/wmv/avi等等
- 🧩 支持自定义打包，可以调整配置，打包出指定格式的demuxer

## 安装
```bash
npm install web-demuxer
```

## 使用
```typescript
import { WebDemuxer } from "web-demuxer"

const demuxer = new WebDemuxer({
  // ⚠️ 你需要将npm包中dist/wasm-files文件放到类似public的静态目录下
  // 并确保wasm-files中的js和wasm文件在同一目录下
  wasmLoaderPath: "https://cdn.jsdelivr.net/npm/web-demuxer@latest/dist/wasm-files/ffmpeg.js",
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

## 样例
- [Seek Video Frame](https://foreversc.github.io/web-demuxer/#example-seek) ｜ [code](https://github.com/ForeverSc/web-demuxer/blob/main/index.html#L96)
- [Play Video](https://foreversc.github.io/web-demuxer/#example-play) ｜ [code](https://github.com/ForeverSc/web-demuxer/blob/main/index.html#L123)

## API
### `WebDemuxer`
#### 构造函数
创建一个新的`WebDemuxer`实例

##### 参数
- `options`: 必填, 配置选项
  - `wasmLoaderPath`: 必填，wasm对应的js loader文件地址（对应npm包中`dist/wasm-files/ffmpeg.js`或`dist/wasm-files/ffmpeg-mini.js`）
  > ⚠️ 你需要确保将wasm 和js loader文件放在同一个可访问目录下，js loader会默认去请求同目录下的wasm文件

#### `load(file: File): Promise<boolean>`
加载文件并等待wasm worker加载完成。需要等待load方法执行成功后，才可以继续调用后续的方法

##### 参数
- `file: File`: 必填，需要处理的`File`对象

#### `getVideoDecoderConfig(): Promise<VideoDecoderConfig>`
解析视频流，获取文件的`VideoDecoderConfig`, 返回值可直接作为`VideoDecoder`的`configure`方法的入参

#### `getAudioDecoderConfig(): Promise<AudioDecoderConfig>`
解析音频流，获取文件的`AudioDecoderConfig`, 返回值可直接作为`AudioDecoder`的`configure`方法的入参

#### `seekEncodedVideoChunk(timestamp: number): Promise<EncodedVideoChunk>`
根据传入时间点，获取指定时间点的视频数据（默认取关键帧），返回值可直接作为`VideoDecoder`的`decode`方法的入参

##### 参数
- `timestamp: number`: 必填，单位为s

#### `seekEncodedAudioChunk(timestamp: number): Promise<EncodedAudioChunk>`
根据传入时间点，获取指定时间点的音频数据，返回值可直接作为`AudioDecoder`的`decode`方法的入参

##### 参数
- `timestamp: number`: 必填，单位为s

#### `readAVPacket(start: number, end: number, streamType?: AVMediaType, streamIndex?: number): ReadableStream<WebAVPacket>`
返回一个`ReadableStream`, 用于流式读取packet数据

#### `getAVStream(streamType?: AVMediaType, streamIndex?: number): Promise<WebAVStream>`
获取文件中指定stream的数据

#### `getAVPacket(timestamp: number, streamType?: AVMediaType, streamIndex?: number): Promise<WebAVPacket>`
获取文件中指定时间点的数据

### 便利API
基于基础API的语义化封装，简化入参
TODO

## 自定义Demuxer
TODO

## License
MIT
