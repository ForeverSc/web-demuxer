import { AVMediaType } from "./avutil";

export enum FFMpegWorkerMessageType {
  FFmpegWorkerLoaded = "FFmpegWorkerLoaded",
  WASMRuntimeInitialized = "WASMRuntimeInitialized",
  LoadWASM = "LoadWASM",
  GetAVPacket = "GetAVPacket",
  GetAVStream = "GetAVStream",
  ReadAVPacket = "ReadAVPacket",
  AVPacketStream = "AVPacketStream",
  ReadNextAVPacket = "ReadNextAVPacket",
  StopReadAVPacket = "StopReadAVPacket",
}

export type FFMpegWorkerMessageData =
  | GetAVPacketMessageData
  | GetAVStreamMessageData
  | ReadAVPacketMessageData
  | LoadWASMMessageData;

export interface GetAVStreamMessageData {
  file: File;
  streamType: AVMediaType;
  streamIndex: number;
}

export interface GetAVPacketMessageData {
  file: File;
  timestamp: number;
  streamType: AVMediaType;
  streamIndex: number;
}

export interface ReadAVPacketMessageData {
  file: File;
  start: number;
  end: number;
  streamType: AVMediaType;
  streamIndex: number;
}

export interface LoadWASMMessageData {
  wasmLoaderPath: string;
}

export interface FFMpegWorkerMessage {
  type: FFMpegWorkerMessageType;
  data: FFMpegWorkerMessageData;
}
