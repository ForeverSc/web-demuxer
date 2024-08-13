/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, beforeAll, test, expect } from "vitest";
import WebDemuxer from "../src";

const wasmLoaderPath = `${window.location.origin}/wasm-files/ffmpeg.js`;
const miniWasmLoaderPath = `${window.location.origin}/wasm-files/ffmpeg-mini.js`;

async function fetchFile(filename: string) {
  const blob = await (await fetch(`${window.location.origin}/media/${filename}`)).blob()
  const file = new File([blob], "test.mp4")

  return file
}

describe("WebDemuxer", () => {
  let demuxer: WebDemuxer;

  beforeAll(() => {
    demuxer = new WebDemuxer({
      wasmLoaderPath
    });
  })

  test("should be able to create a new instance", () => {
    expect(demuxer).toBeDefined();
  })

  test("should be able to load avc file", async () => {
    const file = await fetchFile("avc.mp4")
    await demuxer.load(file).catch(e => {
      console.error(e)
    })
    const avStream = await demuxer.getAVStream()
    console.log('avStream', avStream)
  });
})