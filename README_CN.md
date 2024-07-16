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
### NPM
```bash
npm install web-demuxer
```

### CDN
```html
<script type="module">
  import { WebDemuxer } from 'https://cdn.jsdelivr.net/npm/web-demuxer@latest/dist/web-demuxer.min.js';
</script>
```

## 使用
```typescript
import { WebDemuxer } from "web-demuxer"

const demuxer = new WebDemuxer({
  // ⚠️ 你需要将npm包中dist/wasm-files文件放到类似public的静态目录下
  // 并确保wasm-files中的js和wasm文件在同一目录下
  wasmLoaderPath: "https://cdn.jsdelivr.net/npm/web-demuxer@latest/dist/wasm-files/ffmpeg.min.js",
})

// 以获取指定时间点的视频帧为例
async function seek(file, time) {
  // 1. 加载视频文件
  await demuxer.load(file);

  // 2. 解封装视频文件并生成WebCodecs所需的VideoDecoderConfig和EncodedVideoChunk
  const videoDecoderConfig = await demuxer.getVideoDecoderConfig();
  const videoChunk = await demuxer.seekEncodedVideoChunk(time);

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
```typescript
new WebDemuxer(options: WebDemuxerOptions)
```
创建一个新的`WebDemuxer`实例

参数:
- `options`: 必填, 配置选项
  - `wasmLoaderPath`: 必填，wasm对应的js loader文件地址（对应npm包中`dist/wasm-files/ffmpeg.js`或`dist/wasm-files/ffmpeg-mini.js`）
  > ⚠️ 你需要确保将wasm 和js loader文件放在同一个可访问目录下，js loader会默认去请求同目录下的wasm文件

```typescript
load(file: File): Promise<boolean>
```
加载文件并等待wasm worker加载完成。需要等待load方法执行成功后，才可以继续调用后续的方法

参数:
  - `file`: 必填，需要处理的`File`对象  

```typescript
getVideoDecoderConfig(): Promise<VideoDecoderConfig>
```
解析视频流，获取文件的`VideoDecoderConfig`, 返回值可直接作为`VideoDecoder`的`configure`方法的入参  


```typescript
getAudioDecoderConfig(): Promise<AudioDecoderConfig>
```
解析音频流，获取文件的`AudioDecoderConfig`, 返回值可直接作为`AudioDecoder`的`configure`方法的入参

```typescript
seekEncodedVideoChunk(time: number): Promise<EncodedVideoChunk>
```
根据传入时间点，获取指定时间点的视频数据（默认取关键帧），返回值可直接作为`VideoDecoder`的`decode`方法的入参

参数:
- `time`: 必填，单位为s

```typescript
seekEncodedAudioChunk(time: number): Promise<EncodedAudioChunk>
```
根据传入时间点，获取指定时间点的音频数据，返回值可直接作为`AudioDecoder`的`decode`方法的入参

参数:
- `time`: 必填，单位为s

```typescript
readAVPacket(start?: number, end?: number, streamType?: AVMediaType, streamIndex?: number): ReadableStream<WebAVPacket>
```
返回一个`ReadableStream`, 用于流式读取packet数据

参数:
- `start`: 读取开始时间点，单位为s，默认值为0，从头开始读取packet
- `end`: 读取结束时间点，单位为s, 默认值为0，读取到文件末尾
- `streamType`: 媒体流类型，默认值为0, 即视频流，1为音频流。其他具体见`AVMediaType`
- `streamIndex`: 媒体流索引，默认值为-1，即自动选择

```typescript
getAVStream(streamType?: AVMediaType, streamIndex?: number): Promise<WebAVStream>
```
获取媒体文件中指定stream的信息

参数: 
- `streamType`: 媒体流类型，默认值为0, 即视频流，1为音频流。其他具体见`AVMediaType`
- `streamIndex`: 媒体流索引，默认值为-1，即自动选择

基于`getAVStream`的语义简化方法:
- `getVideoStream(streamIndex?: number): Promise<WebAVStream>`
- `getAudioStream(streamIndex?: number): Promise<WebAVStream>`

```typescript
getAVStreams(): Promise<WebAVStream[]>
```
获取媒体文件中所有的stream

```typescript
getAVPacket(time: number, streamType?: AVMediaType, streamIndex?: number): Promise<WebAVPacket>
```
获取媒体文件中指定时间点的数据

参数:
- `time`: 必填，单位为s
- `streamType`: 媒体流类型，默认值为0, 即视频流，1为音频流。其他具体见`AVMediaType`
- `streamIndex`: 媒体流索引，默认值为-1，即自动选择

基于`getAVPacket`的语义简化方法:
- `seekVideoPacket(time: number): Promise<WebAVPacket>`
- `seekAudioPacket(time: number): Promise<WebAVPacket>`
- `readVideoPacket(start?: number, end?: number): ReadableStream<WebAVPacket>`
- `readAudioPacket(start?: number, end?: number): ReadableStream<WebAVPacket>`

```typescript
getAVPackets(time: number): Promise<WebAVPacket[]>
```
同时获取某个时间点，所有stream上的packet数据, 并按照stream数组顺序返回

参数:
- `time`: 必填，单位为s

```typescript
destroy(): void
```
销毁实例，释放worker

## 自定义Demuxer
目前默认提供两个版本的demuxer, 用于支持不同的格式:
- `dist/wasm-files/ffmpeg.js`: 完整版(gzip: 941 kB), 体积较大，支持mov,mp4,m4a,3gp,3g2,mj2,avi,flv,matroska,webm,m4v,mpegi,asf
- `dist/wasm-files/ffmpeg-mini.js`: 精简版本(gzip: 115 kB)，体积小，仅支持mov,mp4,m4a,3gp,3g2,matroska,webm,m4v

你也可以通过自定义配置，实现指定格式的demxuer：

首先，修改`Makefile`中的`enable-demuxer`配置
```makefile
DEMUX_ARGS = \
	--enable-demuxer=mov,mp4,m4a,3gp,3g2,mj2,avi,flv,matroska,webm,m4v,mpegi,asf
```
然后先执行`npm run dev:docker:arm64`（如果是windows, 请执行`npm run dev:docker:x86_64`），启动docker环境。   

最后，执行`npm run build:wasm`，构建指定格式的demxuer

## License
MIT
