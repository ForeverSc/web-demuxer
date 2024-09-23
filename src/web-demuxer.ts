import {
  AVLogLevel,
  AVMediaType,
  AVSeekFlag,
  FFMpegWorkerMessageData,
  FFMpegWorkerMessageType,
  WebAVPacket,
  WebAVStream,
  WebMediaInfo,
} from "./types";
import FFmpegWorker from "./ffmpeg.worker.ts?worker&inline";

const TIME_BASE = 1000000;

interface WebDemuxerOptions {
  /**
   * path to the wasm loader
   */
  wasmLoaderPath: string;
}

/**
 * WebDemuxer
 * 
 * Timeline:
 * FFmpegWorkerLoaded => LoadWASM => WASMRuntimeInitialized
 */
export class WebDemuxer {
  private ffmpegWorker: Worker;
  private ffmpegWorkerLoadStatus: Promise<boolean>;
  private msgId: number;

  public file?: File;

  constructor(options: WebDemuxerOptions) {
    this.ffmpegWorker = new FFmpegWorker();
    this.ffmpegWorkerLoadStatus = new Promise((resolve, reject) => {
      this.ffmpegWorker.addEventListener("message", (e) => {
        const { type, errMsg } = e.data;

        if (type === FFMpegWorkerMessageType.FFmpegWorkerLoaded) {
          this.post(FFMpegWorkerMessageType.LoadWASM, {
            wasmLoaderPath: options.wasmLoaderPath,
          });
        }

        if (type === FFMpegWorkerMessageType.WASMRuntimeInitialized) {
          resolve(true);
        }

        if (type === FFMpegWorkerMessageType.LoadWASM && errMsg) {
          reject(errMsg);
        }
      });
    });

    this.msgId = 0;
  }

  private post(
    type: FFMpegWorkerMessageType,
    data?: FFMpegWorkerMessageData,
    msgId?: number,
  ) {
    this.ffmpegWorker.postMessage({
      type,
      msgId: msgId ?? this.msgId++,
      data,
    });
  }

  private getFromWorker<T>(type: FFMpegWorkerMessageType, msgData: FFMpegWorkerMessageData): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.file) {
        reject("file is not loaded");
        return;
      }

      const msgId = this.msgId;
      const msgListener = ({ data }: MessageEvent) => {
        if (data.type === type && data.msgId === msgId) {
          if (data.errMsg) {
            reject(data.errMsg);
          } else {
            resolve(data.result);
          }
          this.ffmpegWorker.removeEventListener("message", msgListener);
        }
      };

      this.ffmpegWorker.addEventListener("message", msgListener);
      this.post(type, msgData, msgId);
    });
  }

  /**
   * Load a file for demuxing
   * @param file file to load
   * @returns load status
   */
  public async load(file: File) {
    const status = await this.ffmpegWorkerLoadStatus;

    this.file = file;

    return status;
  }

  /**
   * Destroy the demuxer instance
   * terminate the worker
   */
  public destroy() {
    this.file = undefined;
    this.ffmpegWorker.terminate();
  }

  // ================ base api ================
  /**
   * Gets information about a specified stream in the media file.
   * @param streamType The type of media stream
   * @param streamIndex The index of the media stream
   * @returns WebAVStream
   */
  public getAVStream(
    streamType = AVMediaType.AVMEDIA_TYPE_VIDEO,
    streamIndex = -1,
  ): Promise<WebAVStream> {
    return this.getFromWorker(FFMpegWorkerMessageType.GetAVStream, {
      file: this.file!,
      streamType,
      streamIndex,
    });
  }

  /**
   * Get all streams
   * @returns WebAVStream[]
   */
  public getAVStreams(): Promise<WebAVStream[]> {
    return this.getFromWorker(FFMpegWorkerMessageType.GetAVStreams, {
      file: this.file!,
    });
  }

  /**
   * Get file media info
   * @returns WebMediaInfo
   */
  public getMediaInfo(): Promise<WebMediaInfo> {
    return this.getFromWorker(FFMpegWorkerMessageType.GetMediaInfo, {
      file: this.file!,
    });
  }

  /**
   * Gets the data at a specified time point in the media file.
   * @param time time in seconds
   * @param streamType The type of media stream
   * @param streamIndex The index of the media stream
   * @param seekFlag The seek flag
   * @returns WebAVPacket
   */
  public getAVPacket(
    time: number,
    streamType = AVMediaType.AVMEDIA_TYPE_VIDEO,
    streamIndex = -1,
    seekFlag = AVSeekFlag.AVSEEK_FLAG_BACKWARD
  ): Promise<WebAVPacket> {
    return this.getFromWorker(FFMpegWorkerMessageType.GetAVPacket, {
      file: this.file!,
      time,
      streamType,
      streamIndex,
      seekFlag
    });
  }

  /**
   * Get all packets at a time point from all streams
   * @param time time in seconds
   * @param seekFlag The seek flag
   * @returns WebAVPacket[]
   */
  public getAVPackets(
    time: number,
    seekFlag = AVSeekFlag.AVSEEK_FLAG_BACKWARD
  ): Promise<WebAVPacket[]> {
    return this.getFromWorker(FFMpegWorkerMessageType.GetAVPackets, {
      file: this.file!,
      time,
      seekFlag
    });
  }

  /**
   * Returns a `ReadableStream` for streaming packet data.
   * @param start start time in seconds
   * @param end end time in seconds
   * @param streamType The type of media stream
   * @param streamIndex The index of the media stream
   * @param seekFlag The seek flag
   * @returns ReadableStream<WebAVPacket>
   */
  public readAVPacket(
    start = 0,
    end = 0,
    streamType = AVMediaType.AVMEDIA_TYPE_VIDEO,
    streamIndex = -1,
    seekFlag = AVSeekFlag.AVSEEK_FLAG_BACKWARD
  ): ReadableStream<WebAVPacket> {
    const queueingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });
    const msgId = this.msgId;
    let pullCounter = 0;

    return new ReadableStream(
      {
        start: (controller) => {
          if (!this.file) {
            controller.error("file is not loaded");
            return;
          }
          const msgListener = (e: MessageEvent) => {
            const data = e.data;

            if (
              data.type === FFMpegWorkerMessageType.ReadAVPacket &&
              data.msgId === msgId
            ) {
              if (data.errMsg) {
                controller.error(data.errMsg);
                this.ffmpegWorker.removeEventListener("message", msgListener);
              } else {
                // noop
              }
            }

            if (
              data.type === FFMpegWorkerMessageType.AVPacketStream &&
              data.msgId === msgId
            ) {
              if (data.result) {
                controller.enqueue(data.result);
              } else {
                controller.close();
              }
            }
          };

          this.ffmpegWorker.addEventListener("message", msgListener);
          this.post(FFMpegWorkerMessageType.ReadAVPacket, {
            file: this.file,
            start,
            end,
            streamType,
            streamIndex,
            seekFlag
          });
        },
        pull: () => {
          // first pull called by read don't send read next message
          if (pullCounter > 0) {
            this.post(
              FFMpegWorkerMessageType.ReadNextAVPacket,
              undefined,
              msgId,
            );
          }
          pullCounter++;
        },
        cancel: () => {
          this.post(FFMpegWorkerMessageType.StopReadAVPacket, undefined, msgId);
        },
      },
      queueingStrategy,
    );
  }

  /**
   * Set log level
   * @param level log level
   */
  public setLogLevel(level: AVLogLevel) {
    return this.getFromWorker(FFMpegWorkerMessageType.SetAVLogLevel, { level })
  }

  // ================ convenience api ================

  /**
   * Get video stream
   * @param streamType The type of media stream
   * @returns WebAVStream
   */
  public getVideoStream(streamIndex?: number) {
    return this.getAVStream(AVMediaType.AVMEDIA_TYPE_VIDEO, streamIndex);
  }

  /**
   * Get audio stream
   * @param streamIndex The index of the media stream
   * @returns 
   */
  public getAudioStream(streamIndex?: number) {
    return this.getAVStream(AVMediaType.AVMEDIA_TYPE_AUDIO, streamIndex);
  }

  /**
   * Seek video packet at a time point
   * @param time seek time in seconds
   * @param seekFlag The seek flag
   * @returns WebAVPacket
   */
  public seekVideoPacket(time: number, seekFlag?: AVSeekFlag) {
    return this.getAVPacket(time, AVMediaType.AVMEDIA_TYPE_VIDEO, undefined, seekFlag);
  }

  /**
   * Seek audio packet at a time point
   * @param time seek time in seconds
   * @param seekFlag The seek flag
   * @returns WebAVPacket
   */
  public seekAudioPacket(time: number, seekFlag?: AVSeekFlag) {
    return this.getAVPacket(time, AVMediaType.AVMEDIA_TYPE_AUDIO, undefined, seekFlag);
  }

  /**
   * Read video packet as a stream
   * @param start start time in seconds
   * @param end  end time in seconds
   * @param seekFlag The seek flag
   * @returns ReadableStream<WebAVPacket>
   */
  public readVideoPacket(start?: number, end?: number, seekFlag?: AVSeekFlag) {
    return this.readAVPacket(
      start,
      end,
      AVMediaType.AVMEDIA_TYPE_VIDEO,
      undefined,
      seekFlag,
    );
  }

  /**
   * Read audio packet as a stream
   * @param start start time in seconds
   * @param end end time in seconds
   * @param seekFlag The seek flag
   * @returns ReadableStream<WebAVPacket>
   */
  public readAudioPacket(start?: number, end?: number, seekFlag?: AVSeekFlag) {
    return this.readAVPacket(
      start,
      end,
      AVMediaType.AVMEDIA_TYPE_AUDIO,
      undefined,
      seekFlag
    );
  }

  // =========== custom api for webcodecs ===========

  /**
   * Generate VideoDecoderConfig from WebAVStream
   * @param avStream WebAVStream
   * @returns VideoDecoderConfig
   */
  public genVideoDecoderConfig(avStream: WebAVStream): VideoDecoderConfig {
    return {
      codec: avStream.codec_string,
      codedWidth: avStream.width,
      codedHeight: avStream.height,
      description:
        avStream.extradata?.length > 0
          ? avStream.extradata
          : undefined,
    };
  }

  /**
   * Generate EncodedVideoChunk from WebAVPacket
   * @param avPacket WebAVPacket
   * @returns EncodedVideoChunk
   */
  public genEncodedVideoChunk(avPacket: WebAVPacket): EncodedVideoChunk {
    return new EncodedVideoChunk({
      type: avPacket.keyframe === 1 ? "key" : "delta",
      timestamp: avPacket.timestamp * TIME_BASE,
      duration: avPacket.duration * TIME_BASE,
      data: avPacket.data,
    });
  }

  /**
   * Generate AudioDecoderConfig from WebAVStream
   * @param avStream WebAVStream
   * @returns AudioDecoderConfig
   */
  public genAudioDecoderConfig(avStream: WebAVStream): AudioDecoderConfig {
    return {
      codec: avStream.codec_string || "",
      sampleRate: avStream.sample_rate,
      numberOfChannels: avStream.channels,
      description:
        avStream.extradata?.length > 0
          ? avStream.extradata
          : undefined,
    };
  }

  /**
   * Generate EncodedAudioChunk from WebAVPacket
   * @param avPacket WebAVPacket
   * @returns EncodedAudioChunk
   */
  public genEncodedAudioChunk(avPacket: WebAVPacket): EncodedAudioChunk {
    return new EncodedAudioChunk({
      type: avPacket.keyframe === 1 ? "key" : "delta",
      timestamp: avPacket.timestamp * TIME_BASE,
      duration: avPacket.duration * TIME_BASE,
      data: avPacket.data,
    });
  }

  /**
   * Get WebCodecs VideoDecoderConfig
   * @returns VideoDecoderConfig
   */
  public async getVideoDecoderConfig() {
    const videoStream = await this.getVideoStream();

    return this.genVideoDecoderConfig(videoStream);
  }

  /**
   * Seek and return EncodedVideoChunk
   * @param time time in seconds
   * @param seekFlag The seek flag
   * @returns EncodedVideoChunk
   */
  public async seekEncodedVideoChunk(time: number, seekFlag?: AVSeekFlag) {
    const videoPacket = await this.seekVideoPacket(time, seekFlag);

    return this.genEncodedVideoChunk(videoPacket);
  }

  /**
   * Get WebCodecs AudioDecoderConfig
   * @returns AudioDecoderConfig
   */
  public async getAudioDecoderConfig() {
    const audioStream = await this.getAudioStream();

    return this.genAudioDecoderConfig(audioStream);
  }

  /**
   * Seek and return EncodedAudioChunk
   * @param time time in seconds
   * @param seekFlag The seek flag
   * @returns EncodedAudioChunk
   */
  public async seekEncodedAudioChunk(time: number, seekFlag?: AVSeekFlag) {
    const audioPacket = await this.seekAudioPacket(time, seekFlag);

    return this.genEncodedAudioChunk(audioPacket);
  }
}
