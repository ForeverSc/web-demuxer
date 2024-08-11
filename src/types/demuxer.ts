/**
 * sync with web-demuxer.h
 */
import { AVMediaType } from "./avutil";

export interface WebAVStream {
  index: number;
  id: number;
  start_time: number;
  duration: number;
  nb_frames: number;
  codec_type: AVMediaType;
  codec_id: number;
  codec_string: string;
  format: number;
  profile: number;
  level: number;
  width: number;
  height: number;
  channels: number;
  sample_rate: number;
  extradata_size: number;
  extradata: Uint8Array;
}

export interface WebAVPacket {
  keyframe: 0 | 1;
  timestamp: number;
  duration: number;
  size: number;
  data: Uint8Array;
}
