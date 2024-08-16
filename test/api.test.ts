/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, beforeAll, test, expect, vi } from "vitest";
import WebDemuxer from "../dist/web-demuxer";

const wasmLoaderPath = `${window.location.origin}/wasm-files/ffmpeg.js`;

async function fetchFile(filename: string) {
  const blob = await (await fetch(`${window.location.origin}/media/${filename}`)).blob()
  const file = new File([blob], "test.mp4")

  return file
}

describe("WebDemuxer API Test", () => {
  let demuxer: WebDemuxer;

  beforeAll(async () => {
    demuxer = new WebDemuxer({
      wasmLoaderPath
    });
    const file = await fetchFile("mov_h264_aac.mp4")

    await demuxer.load(file)
  })

  test("should be able to load avc file",  async () => {
    const avStream = await demuxer.getAVStream()

    expect(avStream).toBeDefined()
    expect(avStream.codec_string).toBe("avc1.4d400c")
  });
})