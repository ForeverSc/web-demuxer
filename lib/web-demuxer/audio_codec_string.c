#include "audio_codec_string.h"
#include "libavformat/internal.h"
#include "libavutil/avstring.h"
#include "libavutil/intreadwrite.h"

// sync with ff_mp4_obj_type in isom.c 
const AVCodecTag _ff_mp4_obj_type[] = {
    { AV_CODEC_ID_MOV_TEXT    , 0x08 },
    { AV_CODEC_ID_MPEG4       , 0x20 },
    { AV_CODEC_ID_H264        , 0x21 },
    { AV_CODEC_ID_HEVC        , 0x23 },
    { AV_CODEC_ID_AAC         , 0x40 },
    { AV_CODEC_ID_MP4ALS      , 0x40 }, /* 14496-3 ALS */
    { AV_CODEC_ID_MPEG2VIDEO  , 0x61 }, /* MPEG-2 Main */
    { AV_CODEC_ID_MPEG2VIDEO  , 0x60 }, /* MPEG-2 Simple */
    { AV_CODEC_ID_MPEG2VIDEO  , 0x62 }, /* MPEG-2 SNR */
    { AV_CODEC_ID_MPEG2VIDEO  , 0x63 }, /* MPEG-2 Spatial */
    { AV_CODEC_ID_MPEG2VIDEO  , 0x64 }, /* MPEG-2 High */
    { AV_CODEC_ID_MPEG2VIDEO  , 0x65 }, /* MPEG-2 422 */
    { AV_CODEC_ID_AAC         , 0x66 }, /* MPEG-2 AAC Main */
    { AV_CODEC_ID_AAC         , 0x67 }, /* MPEG-2 AAC Low */
    { AV_CODEC_ID_AAC         , 0x68 }, /* MPEG-2 AAC SSR */
    { AV_CODEC_ID_MP3         , 0x69 }, /* 13818-3 */
    { AV_CODEC_ID_MP2         , 0x69 }, /* 11172-3 */
    { AV_CODEC_ID_MPEG1VIDEO  , 0x6A }, /* 11172-2 */
    { AV_CODEC_ID_MP3         , 0x6B }, /* 11172-3 */
    { AV_CODEC_ID_MJPEG       , 0x6C }, /* 10918-1 */
    { AV_CODEC_ID_PNG         , 0x6D },
    { AV_CODEC_ID_JPEG2000    , 0x6E }, /* 15444-1 */
    { AV_CODEC_ID_VC1         , 0xA3 },
    { AV_CODEC_ID_DIRAC       , 0xA4 },
    { AV_CODEC_ID_AC3         , 0xA5 },
    { AV_CODEC_ID_EAC3        , 0xA6 },
    { AV_CODEC_ID_DTS         , 0xA9 }, /* mp4ra.org */
    { AV_CODEC_ID_OPUS        , 0xAD }, /* mp4ra.org */
    { AV_CODEC_ID_VP9         , 0xB1 }, /* mp4ra.org */
    { AV_CODEC_ID_TSCC2       , 0xD0 }, /* nonstandard, camtasia uses it */
    { AV_CODEC_ID_EVRC        , 0xD1 }, /* nonstandard, pvAuthor uses it */
    { AV_CODEC_ID_VORBIS      , 0xDD }, /* nonstandard, gpac uses it */
    { AV_CODEC_ID_DVD_SUBTITLE, 0xE0 }, /* nonstandard, see unsupported-embedded-subs-2.mp4 */
    { AV_CODEC_ID_QCELP       , 0xE1 },
    { AV_CODEC_ID_MPEG4SYSTEMS, 0x01 },
    { AV_CODEC_ID_MPEG4SYSTEMS, 0x02 },
    { AV_CODEC_ID_NONE        ,    0 },
};

void set_aac_codec_string(char *str, size_t str_size, AVCodecParameters *par)
{

    av_strlcpy(str, "mp4a", str_size);

    const AVCodecTag *tags[1] = { NULL };
    uint32_t oti;

    tags[0] = _ff_mp4_obj_type;
    oti = av_codec_get_tag(tags, par->codec_id);

    if (oti)
        av_strlcatf(str, str_size, ".%02" PRIx32, oti);
    else
        return;

    if (par->extradata_size >= 2)
    {
        int aot = par->extradata[0] >> 3;
        if (aot == 31)
            aot = ((AV_RB16(par->extradata) >> 5) & 0x3f) + 32;
        av_strlcatf(str, str_size, ".%d", aot);
    }
}

void set_audio_codec_string(char *str, size_t str_size, AVCodecParameters *par)
{
    switch (par->codec_id)
    {
    case AV_CODEC_ID_FLAC:
        av_strlcpy(str, "flac", str_size);
        break;
    case AV_CODEC_ID_MP3:
        av_strlcpy(str, "mp3", str_size);
        break;
    case AV_CODEC_ID_AAC:
        set_aac_codec_string(str, str_size, par);
        break;
    case AV_CODEC_ID_OPUS:
        av_strlcpy(str, "opus", str_size);
        break;
    case AV_CODEC_ID_VORBIS:
        av_strlcpy(str, "vorbis", str_size);
        break;
    case AV_CODEC_ID_PCM_MULAW:
        av_strlcpy(str, "ulaw", str_size);
        break;
    case AV_CODEC_ID_PCM_ALAW:
        av_strlcpy(str, "alaw", str_size);
        break;
    case AV_CODEC_ID_PCM_U8:
        av_strlcpy(str, "pcm-u8", str_size);
        break;
    case AV_CODEC_ID_PCM_S16LE:
    case AV_CODEC_ID_PCM_S16BE:
        av_strlcpy(str, "pcm-s16", str_size);
        break;
    case AV_CODEC_ID_PCM_S24LE:
    case AV_CODEC_ID_PCM_S24BE:
        av_strlcpy(str, "pcm-s24", str_size);
        break;
    case AV_CODEC_ID_PCM_S32LE:
    case AV_CODEC_ID_PCM_S32BE:
        av_strlcpy(str, "pcm-s32", str_size);
        break;
    case AV_CODEC_ID_PCM_F32LE:
    case AV_CODEC_ID_PCM_F32BE:
        av_strlcpy(str, "pcm-f32", str_size);
        break;
    default:
        av_strlcpy(str, "undf", str_size);
        break;
    }
}