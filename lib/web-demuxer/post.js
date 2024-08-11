class WorkerFile {
  constructor(file) {
    this.mountPoint = "/data";
    this.mountOpts = {
      files: [file],
    };
    this.filePath = this.mountPoint + "/" + file.name;
  }

  mount() {
    FS.mkdir(this.mountPoint);
    FS.mount(FS.filesystems.WORKERFS, this.mountOpts, this.mountPoint);
  }

  unmount() {
    FS.unmount(this.mountPoint);
    FS.rmdir(this.mountPoint);
  }
}

function avStreamToObject(avStream) {
  const extradata = new Uint8Array(avStream.extradata);
  const tags = {};

  for(let i = 0; i < avStream.tags.size(); i++) {
    const { key, value } = avStream.tags.get(i);
    tags[key] = value;
  }

  const result = {
    id: avStream.id,
    index: avStream.index,
    code_type: avStream.code_type,
    codec_name: avStream.codec_name,
    codec_string: avStream.codec_string,
    profile: avStream.profile,
    pix_fmt: avStream.pix_fmt,
    level: avStream.level,
    width: avStream.width,
    height: avStream.height,
    channels: avStream.channels,
    sample_rate: avStream.sample_rate,
    sample_fmt: avStream.sample_fmt,
    bit_rate: avStream.bit_rate,
    extradata_size: avStream.extradata_size,
    extradata,
    r_frame_rate: avStream.r_frame_rate,
    avg_frame_rate: avStream.avg_frame_rate,
    sample_aspect_ratio: avStream.sample_aspect_ratio,
    display_aspect_ratio: avStream.display_aspect_ratio,
    start_time: avStream.start_time,
    duration: avStream.duration,
    nb_frames: avStream.nb_frames,
    tags
  };

  avStream.delete();

  return result;
}

function avPacketToObject(avPacket) {
  const data = new Uint8Array(avPacket.data);

  const result = {
    keyframe: avPacket.keyframe,
    timestamp: avPacket.timestamp,
    duration: avPacket.duration,
    size: avPacket.size,
    data
  };

  avPacket.delete();

  return result;
}

function getAVStream(file, type = 0, streamIndex = -1) {
  const workerFile = new WorkerFile(file);

  workerFile.mount();

  try {
    const avStream = Module.get_av_stream(workerFile.filePath, type, streamIndex);

    return avStreamToObject(avStream);
  } catch(e) {
    throw new Error("get_av_stream failed: " + e.message);
  } finally {
    workerFile.unmount()
  }
}

function getAVStreams(file) {
  const workerFile = new WorkerFile(file);

  workerFile.mount();

  try {
    const avStreamList = Module.get_av_streams(workerFile.filePath);
    const result = [] 

    for (let i = 0; i < avStreamList.streams.size(); i++) {
      result.push(avStreamToObject(avStreamList.streams.get(i)));
    }

    avStreamList.streams.delete();

    return result;
  } catch(e) {
    throw new Error("get_av_streams failed: " + e.message);
  } finally {
    workerFile.unmount();
  }
}

function getAVPacket(file, time, type, streamIndex) {
  const workerFile = new WorkerFile(file);

  workerFile.mount();

  try {
    const avPacket = Module.get_av_packet(workerFile.filePath, time, type, streamIndex);

    return avPacketToObject(avPacket);
  } catch(e) {
    throw new Error("get_av_packet failed: " + e.message);
  } finally {
    workerFile.unmount()
  }
}

function getAVPackets(file, time) {
  const workerFile = new WorkerFile(file);

  workerFile.mount();

  try {
    const avPacketList = Module.get_av_packets(workerFile.filePath, time);
    const result = [];

    for (let i = 0; i < avPacketList.packets.size(); i++) {
      result.push(avPacketToObject(avPacketList.packets.get(i)));
    }

    avPacketList.packets.delete();

    return result;
  } catch(e) {
    throw new Error("get_av_packets failed: " + e.message);
  } finally {
    workerFile.unmount()
  }
}

async function readAVPacket(
  msgId,
  file,
  start = 0,
  end = 0,
  type = 0,
  streamIndex = -1,
) {
  const workerFile = new WorkerFile(file);

  workerFile.mount();

  try {
    const result = await Module.read_av_packet(msgId, workerFile.filePath, start, end, type, streamIndex);

    if (result === 0) {
      throw new Error("return 0");
    }
  } catch(e) {
    throw new Error("read_av_packet failed: " + e.message);
  } finally {
    workerFile.unmount()
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
