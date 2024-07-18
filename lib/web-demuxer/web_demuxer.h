#include "emscripten/emscripten.h"
#include "libavformat/avformat.h"
#include "libavutil/avutil.h"
#include "libavcodec/avcodec.h"
#include "libavcodec/codec_id.h"
#include "video_codec_string.h"
#include "audio_codec_string.h"

typedef struct {
    enum AVMediaType codec_type;
    enum AVCodecID   codec_id;
    char *codec_string;
    int format;
    int profile;
    int level;
    int width;
    int height;
    int channels; // audio only
    int sample_rate; // audio only
    int extradata_size;
    uint8_t *extradata;
} WebAVCodecParameters;

typedef struct {
    int index;
    int id;
    double start_time;
    double duration;
    int64_t nb_frames;
    WebAVCodecParameters *codecpar;
} WebAVStream;

typedef struct {
    int keyframe;
    double timestamp;
    double duration;
    int size;
    uint8_t *data;
} WebAVPacket;

typedef struct {
    int size;
    WebAVStream *streams;
} WebAVStreamList;

typedef struct {
    int size;
    WebAVPacket *packets;
} WebAVPacketList;