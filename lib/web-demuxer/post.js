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
    codec_type: avStream.codec_type,
    codec_type_string: avStream.codec_type_string,
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
    rotation: avStream.rotation,
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

function getMediaInfo(file) {
  const workerFile = new WorkerFile(file);

  workerFile.mount();

  try {
    const mediaInfo = Module.get_media_info(workerFile.filePath);
    const result = {
      format_name: mediaInfo.format_name,
      duration: mediaInfo.duration,
      bit_rate: mediaInfo.bit_rate,
      start_time: mediaInfo.start_time,
      nb_streams: mediaInfo.nb_streams,
      streams: []
    };

    for (let i = 0; i < mediaInfo.streams.size(); i++) {
      result.streams.push(avStreamToObject(mediaInfo.streams.get(i)));
    }

    mediaInfo.streams.delete();

    return result;
  } catch(e) {
    throw new Error("get_media_info failed: " + e.message);
  } finally {
    workerFile.unmount();
  }
}

function getAVPacket(file, time, type = 0, streamIndex = -1, seekFlag = 1) {
  const workerFile = new WorkerFile(file);

  workerFile.mount();

  try {
    const avPacket = Module.get_av_packet(workerFile.filePath, time, type, streamIndex, seekFlag);

    return avPacketToObject(avPacket);
  } catch(e) {
    throw new Error("get_av_packet failed: " + e.message);
  } finally {
    workerFile.unmount()
  }
}

function getAVPackets(file, time, seekFlag = 1) {
  const workerFile = new WorkerFile(file);

  workerFile.mount();

  try {
    const avPacketList = Module.get_av_packets(workerFile.filePath, time, seekFlag);
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
  seekFlag = 1
) {
  const workerFile = new WorkerFile(file);

  workerFile.mount();

  try {
    const result = await Module.read_av_packet(workerFile.filePath, start, end, type, streamIndex, seekFlag, {
      sendAVPacket: genSendAVPacket(msgId),
    });

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
function genSendAVPacket(messageId) {
  return function sendAVPacket(avPacket) {
    return new Promise((resolve) => {
        const postData = {
          type: "AVPacketStream",
          msgId: messageId,
          result: null,
        };

        if (avPacket === 0) {
          self.postMessage(postData);
          resolve(1);
          return;
        }

        const result = avPacketToObject(avPacket);

        postData.result = result;
        self.postMessage(postData, [result.data.buffer]);

        const msgListener = (event) => {
          const { type, msgId } = event.data;

          if (msgId === messageId) {
            if (type === "ReadNextAVPacket") {
              self.removeEventListener("message", msgListener);
              resolve(1);
            } else if (type === "StopReadAVPacket") {
              self.removeEventListener("message", msgListener);
              resolve(0);
            }
          }
        };

        self.addEventListener("message", msgListener);
      });
  }
}

function setAVLogLevel(level) {
  Module.set_av_log_level(level);
}

// ============ Module Register ============
Module.getAVStream = getAVStream;
Module.getAVStreams = getAVStreams;
Module.getMediaInfo = getMediaInfo;
Module.getAVPacket = getAVPacket;
Module.getAVPackets = getAVPackets;
Module.readAVPacket = readAVPacket;
Module.setAVLogLevel = setAVLogLevel;

Module.onRuntimeInitialized = () => {
  self.postMessage({ type: "WASMRuntimeInitialized" });
};
