/**
 * sync with web-demuxer.h
 */
import { AVMediaType } from "./avutil";

export interface WebAVStream {
  index: number;
  id: number;
  codec_type: AVMediaType;
  codec_type_string: string;
  codec_name: string;
  codec_string: string;
  profile: string;
  pix_fmt: string;
  level: number;
  width: number;
  height: number;
  channels: number;
  sample_rate: number;
  sample_fmt: string;
  bit_rate: string;
  extradata_size: number;
  extradata: Uint8Array;
  r_frame_rate: string;
  avg_frame_rate: string;
  sample_aspect_ratio: string;
  display_aspect_ratio: string;
  start_time: number;
  duration: number;
  rotation: number;
  nb_frames: string;
  tags: Record<string, string>
}

export interface WebAVPacket {
  keyframe: 0 | 1;
  timestamp: number;
  duration: number;
  size: number;
  data: Uint8Array;
}

export interface WebMediaInfo {
  format_name: string;
  start_time: number;
  duration: number;
  bit_rate: string;
  nb_streams: number;
  nb_chapters: number;
  flags: number;
  streams: WebAVStream[];
}
