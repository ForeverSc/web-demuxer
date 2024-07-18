function getAVStream(file, type = 0, streamIndex = -1) {
  const mountPoint = "/data";
  const mountOpts = {
    files: [file],
  };
  const filePath = mountPoint + "/" + file.name;

  // mount file
  FS.mkdir(mountPoint);
  FS.mount(FS.filesystems.WORKERFS, mountOpts, mountPoint);

  const get_av_stream = Module.cwrap("get_av_stream", "number", [
    "string",
    "number",
    "number",
  ]);
  const av_stream_ptr = get_av_stream(filePath, type, streamIndex);

  // NULL
  if (av_stream_ptr === 0) {
    // unmount file
    FS.unmount(mountPoint);
    FS.rmdir(mountPoint);
    throw new Error("get_av_stream failed");
  }

  // TODO: ts definition sync with c
  const index = Module.getValue(av_stream_ptr, "i32");
  const id = Module.getValue(av_stream_ptr + 4, "i32");
  const start_time = Module.getValue(av_stream_ptr + 8, "double");
  const duration = Module.getValue(av_stream_ptr + 16, "double");
  const nb_frames = Module.getValue(av_stream_ptr + 24, "i64");
  const codecpar_ptr = Module.getValue(av_stream_ptr + 32, "*");
  const codecpar_codec_string_ptr = Module.getValue(codecpar_ptr + 8, "i8*");
  let codecpar = {
    codec_type: Module.getValue(codecpar_ptr, "i32"),
    codec_id: Module.getValue(codecpar_ptr + 4, "i32"),
    codec_string: Module.UTF8ToString(codecpar_codec_string_ptr),
    format: Module.getValue(codecpar_ptr + 12, "i32"),
    profile: Module.getValue(codecpar_ptr + 16, "i32"),
    level: Module.getValue(codecpar_ptr + 20, "i32"),
    width: Module.getValue(codecpar_ptr + 24, "i32"),
    height: Module.getValue(codecpar_ptr + 28, "i32"),
    channels: Module.getValue(codecpar_ptr + 32, "i32"),
    sample_rate: Module.getValue(codecpar_ptr + 36, "i32"),
  };
  const extradata_size = Module.getValue(codecpar_ptr + 40, "i32");
  const extradata_ptr = Module.getValue(codecpar_ptr + 44, "i8*");

  let extradata = Module.HEAPU8.subarray(extradata_ptr, extradata_ptr + extradata_size);

  // copy to js, then free wasm memory
  extradata = new Uint8Array(extradata);

  codecpar = {
    ...codecpar,
    extradata,
    extradata_size,
  };

  const result = {
    index,
    id,
    codecpar,
    start_time,
    duration,
    nb_frames
  };

  // free wasm memory
  Module._free(av_stream_ptr);
  Module._free(codecpar_ptr);
  Module._free(extradata_ptr);
  Module._free(codecpar_codec_string_ptr);

  // unmount file
  FS.unmount(mountPoint);
  FS.rmdir(mountPoint);

  return result;
}

function getAVStreams(file) {
  const mountPoint = "/data";
  const mountOpts = {
    files: [file],
  };
  const filePath = mountPoint + "/" + file.name;

  // mount file
  FS.mkdir(mountPoint);
  FS.mount(FS.filesystems.WORKERFS, mountOpts, mountPoint);

  const get_av_streams = Module.cwrap("get_av_streams", "number", [
    "string",
  ]);
  const av_stream_list_ptr = get_av_streams(filePath);

  // NULL
  if (av_stream_list_ptr === 0) {
    // unmount file
    FS.unmount(mountPoint);
    FS.rmdir(mountPoint);
    throw new Error("get_av_streams failed");
  }

  const list_size = Module.getValue(av_stream_list_ptr, "i32");
  const av_streams_ptr = Module.getValue(av_stream_list_ptr + 4, "i8*");
  const av_stream_ptr_size = 32;
  const av_streams = [];

  for(let i = 0; i < list_size; i++) {
    const av_stream_ptr = av_streams_ptr + i * av_stream_ptr_size;
    const index = Module.getValue(av_stream_ptr, "i32");
    const id = Module.getValue(av_stream_ptr + 4, "i32");
    const start_time = Module.getValue(av_stream_ptr + 8, "double");
    const duration = Module.getValue(av_stream_ptr + 16, "double");
    const codecpar_ptr = Module.getValue(av_stream_ptr + 24, "*");
    const codecpar_codec_string_ptr = Module.getValue(codecpar_ptr + 8, "i8*");
    let codecpar = {
      codec_type: Module.getValue(codecpar_ptr, "i32"),
      codec_id: Module.getValue(codecpar_ptr + 4, "i32"),
      codec_string: Module.UTF8ToString(codecpar_codec_string_ptr),
      format: Module.getValue(codecpar_ptr + 12, "i32"),
      profile: Module.getValue(codecpar_ptr + 16, "i32"),
      level: Module.getValue(codecpar_ptr + 20, "i32"),
      width: Module.getValue(codecpar_ptr + 24, "i32"),
      height: Module.getValue(codecpar_ptr + 28, "i32"),
      channels: Module.getValue(codecpar_ptr + 32, "i32"),
      sample_rate: Module.getValue(codecpar_ptr + 36, "i32"),
    };
    const extradata_size = Module.getValue(codecpar_ptr + 40, "i32");
    const extradata_ptr = Module.getValue(codecpar_ptr + 44, "i8*");

    let extradata = Module.HEAPU8.subarray(extradata_ptr, extradata_ptr + extradata_size);

    // copy to js, then free wasm memory
    extradata = new Uint8Array(extradata);

    codecpar = {
      ...codecpar,
      extradata,
      extradata_size,
    };

    const result = {
      index,
      id,
      codecpar,
      start_time,
      duration,
    };

    av_streams.push(result);

    Module._free(codecpar_ptr);
    Module._free(extradata_ptr);
    Module._free(codecpar_codec_string_ptr);
  }

  // free wasm memory
  Module._free(av_streams_ptr);
  Module._free(av_stream_list_ptr);

  // unmount file
  FS.unmount(mountPoint);
  FS.rmdir(mountPoint);

  return av_streams;
}

function getAVPacket(file, time, type = 0, streamIndex = -1) {
  const mountPoint = "/data";
  const mountOpts = {
    files: [file],
  };
  const filePath = mountPoint + "/" + file.name;

  // mount file
  FS.mkdir(mountPoint);
  FS.mount(FS.filesystems.WORKERFS, mountOpts, mountPoint);

  const get_av_packet = Module.cwrap("get_av_packet", "number", [
    "string",
    "number",
    "number",
    "number",
  ]);
  const av_packet_ptr = get_av_packet(
    filePath,
    time,
    type,
    streamIndex,
  );

  if (av_packet_ptr === 0) {
    // unmount file
    FS.unmount(mountPoint);
    FS.rmdir(mountPoint);
    throw new Error("get_av_packet failed");
  }

  const keyframe = Module.getValue(av_packet_ptr, "i32");
  const timestamp = Module.getValue(av_packet_ptr + 8, "double");
  const duration = Module.getValue(av_packet_ptr + 16, "double");
  const size = Module.getValue(av_packet_ptr + 24, "i32");
  const data_ptr = Module.getValue(av_packet_ptr + 28, "i8*");
  let data = Module.HEAPU8.subarray(data_ptr, data_ptr + size);

  // copy to js, then free wasm memory
  data = new Uint8Array(data);

  const result = {
    keyframe,
    timestamp,
    duration,
    size,
    data,
  };

  // free wasm memory
  Module._free(av_packet_ptr);
  Module._free(data_ptr);

  // unmount file
  FS.unmount(mountPoint);
  FS.rmdir(mountPoint);

  return result;
}

function getAVPackets(file, time) {
  const mountPoint = "/data";
  const mountOpts = {
    files: [file],
  };
  const filePath = mountPoint + "/" + file.name;

  // mount file
  FS.mkdir(mountPoint);
  FS.mount(FS.filesystems.WORKERFS, mountOpts, mountPoint);


  const get_av_packets = Module.cwrap("get_av_packets", "number", [
    "string",
    "number",
  ]);
  const av_packet_list_ptr = get_av_packets(
    filePath,
    time,
  );

  if (av_packet_list_ptr === 0) {
    // unmount file
    FS.unmount(mountPoint);
    FS.rmdir(mountPoint);
    throw new Error("get_av_packets failed");
  }

  const list_size = Module.getValue(av_packet_list_ptr, "i32");
  const av_packets_ptr = Module.getValue(av_packet_list_ptr + 4, "i8*");
  const av_packet_ptr_size = 32;
  const av_packets = []

  for(let i = 0; i < list_size; i++) {
    const av_packet_item_ptr = av_packets_ptr + i * av_packet_ptr_size;

    const keyframe = Module.getValue(av_packet_item_ptr, "i32");
    const timestamp = Module.getValue(av_packet_item_ptr + 8, "double");
    const duration = Module.getValue(av_packet_item_ptr + 16, "double");
    const size = Module.getValue(av_packet_item_ptr + 24, "i32");
    const data_ptr = Module.getValue(av_packet_item_ptr + 28, "i8*");

    let data = Module.HEAPU8.subarray(data_ptr, data_ptr + size);

    data = new Uint8Array(data);

    const packet = {
      keyframe,
      timestamp,
      duration,
      size,
      data,
    };

    av_packets.push(packet);
    Module._free(data_ptr);
  }

  Module._free(av_packets_ptr);
  Module._free(av_packet_list_ptr)

  // unmount file
  FS.unmount(mountPoint);
  FS.rmdir(mountPoint);

  return av_packets;
}

function readAVPacket(
  msgId,
  file,
  start = 0,
  end = 0,
  type = 0,
  streamIndex = -1,
) {
  const mountPoint = "/data";
  const mountOpts = {
    files: [file],
  };
  const filePath = mountPoint + "/" + file.name;

  // mount file
  FS.mkdir(mountPoint);
  FS.mount(FS.filesystems.WORKERFS, mountOpts, mountPoint);

  const read_av_packet = Module.cwrap(
    "read_av_packet",
    null,
    ["number", "string", "number", "number", "number", "number"],
    { async: true },
  );

  const result = read_av_packet(msgId, filePath, start, end, type, streamIndex);

  // unmount file
  FS.unmount(mountPoint);
  FS.rmdir(mountPoint);

  if (result === 0) {
    throw new Error("read_av_packet failed");
  }
}

// ============ js methods called in c ============
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sendAVPacket(msg_id, av_packet_ptr) {
  return new Promise((resolve, reject) => {
    const postData = {
      type: "AVPacketStream",
      msgId: msg_id,
      result: null,
    };

    if (av_packet_ptr === 0) {
      self.postMessage(postData);
      resolve();
      return;
    }
    const keyframe = Module.getValue(av_packet_ptr, "i32");
    const timestamp = Module.getValue(av_packet_ptr + 8, "double");
    const duration = Module.getValue(av_packet_ptr + 16, "double");
    const size = Module.getValue(av_packet_ptr + 24, "i32");
    const data_ptr = Module.getValue(av_packet_ptr + 28, "i8*");
    let data = Module.HEAPU8.subarray(data_ptr, data_ptr + size);

    data = new Uint8Array(data);

    const result = {
      keyframe,
      timestamp,
      duration,
      size,
      data,
    };

    Module._free(av_packet_ptr);
    Module._free(data_ptr);

    postData.result = result;
    self.postMessage(postData, [result.data.buffer]);

    const msgListener = (event) => {
      const { type, msgId } = event.data;

      if (msgId === msg_id) {
        if (type === "ReadNextAVPacket") {
          self.removeEventListener("message", msgListener);
          resolve();
        } else if (type === "StopReadAVPacket") {
          self.removeEventListener("message", msgListener);
          reject();
        }
      }
    };

    self.addEventListener("message", msgListener);
  });
}

// ============ Module Register ============
Module.getAVStream = getAVStream;
Module.getAVStreams = getAVStreams;
Module.getAVPacket = getAVPacket;
Module.getAVPackets = getAVPackets;
Module.readAVPacket = readAVPacket;

Module.onRuntimeInitialized = () => {
  self.postMessage({ type: "WASMRuntimeInitialized" });
};
