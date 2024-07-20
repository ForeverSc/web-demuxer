#include "web_demuxer.h"

EM_ASYNC_JS(int, send_av_packet, (int msg_id, WebAVPacket *av_packet), {
    try
    {
        await sendAVPacket(msg_id, av_packet);
    }
    catch (e)
    {
        return 0;
    }

    return 1;
});

WebAVStream *EMSCRIPTEN_KEEPALIVE get_av_stream(const char *filename, int type, int wanted_stream_nb)
{
    AVFormatContext *fmt_ctx = NULL;
    int ret;

    if ((ret = avformat_open_input(&fmt_ctx, filename, NULL, NULL)) < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot open input file\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    if ((ret = avformat_find_stream_info(fmt_ctx, NULL)) < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot find stream information\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    int stream_index = av_find_best_stream(fmt_ctx, type, wanted_stream_nb, -1, NULL, 0);

    if (stream_index < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot find wanted stream in the input file\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    AVStream *raw_stream = fmt_ctx->streams[stream_index];
    WebAVStream *stream = malloc(sizeof(WebAVStream));

    stream->codecpar = malloc(sizeof(WebAVCodecParameters));

    // codecpar
    stream->codecpar->codec_type = raw_stream->codecpar->codec_type;
    stream->codecpar->codec_id = raw_stream->codecpar->codec_id;

    char codec_string[40];

    if (raw_stream->codecpar->codec_type == AVMEDIA_TYPE_VIDEO)
    {
        set_video_codec_string(codec_string, sizeof(codec_string), raw_stream->codecpar, &raw_stream->avg_frame_rate);
    }
    else if (raw_stream->codecpar->codec_type == AVMEDIA_TYPE_AUDIO)
    {
        set_audio_codec_string(codec_string, sizeof(codec_string), raw_stream->codecpar);
    }
    else
    {
        strcpy(codec_string, "undf");
    }

    stream->codecpar->codec_string = malloc(sizeof(char) * strlen(codec_string));
    strcpy(stream->codecpar->codec_string, codec_string);

    // codecpar->extradata
    stream->codecpar->extradata = malloc(sizeof(uint8_t) * raw_stream->codecpar->extradata_size);
    memcpy(stream->codecpar->extradata, raw_stream->codecpar->extradata, raw_stream->codecpar->extradata_size);

    stream->codecpar->extradata_size = raw_stream->codecpar->extradata_size;
    stream->codecpar->format = raw_stream->codecpar->format;
    stream->codecpar->profile = raw_stream->codecpar->profile;
    stream->codecpar->level = raw_stream->codecpar->level;
    stream->codecpar->width = raw_stream->codecpar->width;
    stream->codecpar->height = raw_stream->codecpar->height;
    stream->codecpar->channels = raw_stream->codecpar->ch_layout.nb_channels;
    stream->codecpar->sample_rate = raw_stream->codecpar->sample_rate;

    // other stream info
    stream->index = raw_stream->index;
    stream->id = raw_stream->id;
    stream->start_time = raw_stream->start_time * av_q2d(raw_stream->time_base);
    stream->duration = raw_stream->duration > 0 ? raw_stream->duration * av_q2d(raw_stream->time_base) : fmt_ctx->duration * av_q2d(AV_TIME_BASE_Q); // TODO: some file type can not get stream duration

    int64_t nb_frames = raw_stream->nb_frames;

    // vp8 codec does not have nb_frames
    if (nb_frames == 0) {
        nb_frames = (fmt_ctx->duration * (double)raw_stream->avg_frame_rate.num) / ((double)raw_stream->avg_frame_rate.den * AV_TIME_BASE);
    }

    stream->nb_frames = nb_frames;

    avformat_close_input(&fmt_ctx);

    return stream;
}

WebAVStreamList *EMSCRIPTEN_KEEPALIVE get_av_streams(const char *filename)
{
    AVFormatContext *fmt_ctx = NULL;
    int ret;

    if ((ret = avformat_open_input(&fmt_ctx, filename, NULL, NULL)) < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot open input file\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    if ((ret = avformat_find_stream_info(fmt_ctx, NULL)) < 0) {
        av_log(NULL, AV_LOG_ERROR, "Cannot find stream information\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    int num_streams = fmt_ctx->nb_streams;
    WebAVStreamList *stream_list = malloc(sizeof(WebAVStreamList));

    if (!stream_list)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot allocate memory for web stream list\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    stream_list->size = num_streams;
    stream_list->streams = malloc(sizeof(WebAVStream) * num_streams);

    if (!stream_list->streams)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot allocate memory for web streams\n");
        avformat_close_input(&fmt_ctx);
        free(stream_list->streams);
        free(stream_list);
        return NULL;
    }

    for (int stream_index = 0; stream_index < num_streams; stream_index++)
    {
        AVStream *raw_stream = fmt_ctx->streams[stream_index];
        WebAVStream *stream = &stream_list->streams[stream_index];
        stream->codecpar = malloc(sizeof(WebAVCodecParameters));

        // codecpar
        stream->codecpar->codec_type = raw_stream->codecpar->codec_type;
        stream->codecpar->codec_id = raw_stream->codecpar->codec_id;

        char codec_string[40];

        if (raw_stream->codecpar->codec_type == AVMEDIA_TYPE_VIDEO)
        {
            set_video_codec_string(codec_string, sizeof(codec_string), raw_stream->codecpar, &raw_stream->avg_frame_rate);
        }
        else if (raw_stream->codecpar->codec_type == AVMEDIA_TYPE_AUDIO)
        {
            set_audio_codec_string(codec_string, sizeof(codec_string), raw_stream->codecpar);
        }
        else
        {
            strcpy(codec_string, "undf");
        }

        stream->codecpar->codec_string = malloc(sizeof(char) * strlen(codec_string));
        strcpy(stream->codecpar->codec_string, codec_string);

        // codecpar->extradata
        stream->codecpar->extradata = malloc(sizeof(uint8_t) * raw_stream->codecpar->extradata_size);
        memcpy(stream->codecpar->extradata, raw_stream->codecpar->extradata, raw_stream->codecpar->extradata_size);

        stream->codecpar->extradata_size = raw_stream->codecpar->extradata_size;
        stream->codecpar->format = raw_stream->codecpar->format;
        stream->codecpar->profile = raw_stream->codecpar->profile;
        stream->codecpar->level = raw_stream->codecpar->level;
        stream->codecpar->width = raw_stream->codecpar->width;
        stream->codecpar->height = raw_stream->codecpar->height;
        stream->codecpar->channels = raw_stream->codecpar->ch_layout.nb_channels;
        stream->codecpar->sample_rate = raw_stream->codecpar->sample_rate;

        // other stream info
        stream->index = raw_stream->index;
        stream->id = raw_stream->id;
        stream->start_time = raw_stream->start_time * av_q2d(raw_stream->time_base);
        stream->duration = raw_stream->duration > 0 ? raw_stream->duration * av_q2d(raw_stream->time_base) : fmt_ctx->duration * av_q2d(AV_TIME_BASE_Q); // TODO: some file type can not get stream duration
    }

    avformat_close_input(&fmt_ctx);

    return stream_list;
}

WebAVPacket *EMSCRIPTEN_KEEPALIVE get_av_packet(const char *filename, double timestamp, int type, int wanted_stream_nb)
{
    AVFormatContext *fmt_ctx = NULL;
    int ret;

    if ((ret = avformat_open_input(&fmt_ctx, filename, NULL, NULL)) < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot open input file\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    if ((ret = avformat_find_stream_info(fmt_ctx, NULL)) < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot find stream information\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    int stream_index = av_find_best_stream(fmt_ctx, type, wanted_stream_nb, -1, NULL, 0);

    if (stream_index < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot find wanted stream in the input file\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    AVPacket *packet = NULL;
    packet = av_packet_alloc();

    if (!packet)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot allocate packet\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    int64_t int64_timestamp = (int64_t)(timestamp * AV_TIME_BASE);
    int64_t seek_time_stamp = av_rescale_q(int64_timestamp, AV_TIME_BASE_Q, fmt_ctx->streams[stream_index]->time_base);

    if ((ret = av_seek_frame(fmt_ctx, stream_index, seek_time_stamp, AVSEEK_FLAG_BACKWARD)) < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot seek to the specified timestamp\n");
        avformat_close_input(&fmt_ctx);
        av_packet_unref(packet);
        av_packet_free(&packet);
        return NULL;
    }

    while (av_read_frame(fmt_ctx, packet) >= 0)
    {
        if (packet->stream_index == stream_index)
        {
            break;
        }
        av_packet_unref(packet);
    }

    if (!packet)
    {
        av_log(NULL, AV_LOG_ERROR, "Failed to get av packet at timestamp\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    WebAVPacket *web_packet = malloc(sizeof(WebAVPacket));

    double packet_timestamp = packet->pts * av_q2d(fmt_ctx->streams[stream_index]->time_base);

    web_packet->keyframe = packet->flags & AV_PKT_FLAG_KEY;
    web_packet->timestamp = packet_timestamp > 0 ? packet_timestamp : 0;
    web_packet->duration = packet->duration * av_q2d(fmt_ctx->streams[stream_index]->time_base);
    web_packet->size = packet->size;
    web_packet->data = malloc(sizeof(uint8_t) * packet->size);
    memcpy(web_packet->data, packet->data, packet->size);

    avformat_close_input(&fmt_ctx);
    av_packet_unref(packet);
    av_packet_free(&packet);

    return web_packet;
}

WebAVPacketList* EMSCRIPTEN_KEEPALIVE get_av_packets(const char *filename, double timestamp) {
    AVFormatContext *fmt_ctx = NULL;
    int ret;

    if ((ret = avformat_open_input(&fmt_ctx, filename, NULL, NULL)) < 0) {
        av_log(NULL, AV_LOG_ERROR, "Cannot open input file\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    if ((ret = avformat_find_stream_info(fmt_ctx, NULL)) < 0) {
        av_log(NULL, AV_LOG_ERROR, "Cannot find stream information\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    int num_streams = fmt_ctx->nb_streams;
    int num_packets = num_streams;
    WebAVPacketList* web_packet_list = malloc(sizeof(WebAVPacketList));

    if (!web_packet_list) {
        av_log(NULL, AV_LOG_ERROR, "Cannot allocate memory for web packet list\n");
        avformat_close_input(&fmt_ctx);
        return NULL;
    }

    web_packet_list->size = num_packets;
    web_packet_list->packets = malloc(sizeof(WebAVPacket) * num_packets);

    if (!web_packet_list->packets) {
        av_log(NULL, AV_LOG_ERROR, "Cannot allocate memory for web packets\n");
        avformat_close_input(&fmt_ctx);
        free(web_packet_list->packets);
        free(web_packet_list);
        return NULL;
    }

    AVPacket *packet = NULL;
    packet = av_packet_alloc();

    if (!packet) {
        av_log(NULL, AV_LOG_ERROR, "Cannot allocate packet\n");
        avformat_close_input(&fmt_ctx);
        free(web_packet_list->packets);
        free(web_packet_list);
        return NULL;
    }

    for (int stream_index = 0; stream_index < num_streams; stream_index++) {
        int64_t int64_timestamp = (int64_t)(timestamp * AV_TIME_BASE); 
        int64_t seek_time_stamp = av_rescale_q(int64_timestamp, AV_TIME_BASE_Q, fmt_ctx->streams[stream_index]->time_base);

        if ((ret = av_seek_frame(fmt_ctx, stream_index, seek_time_stamp, AVSEEK_FLAG_BACKWARD)) < 0) {
            av_log(NULL, AV_LOG_ERROR, "Cannot seek to the specified timestamp\n");
            free(web_packet_list->packets);
            free(web_packet_list);
            return NULL;
        }

        while (av_read_frame(fmt_ctx, packet) >= 0) {
            if (packet->stream_index == stream_index) {
                break;
            }
            av_packet_unref(packet);
        }

        if (!packet) {
            av_log(NULL, AV_LOG_ERROR, "Failed to get av packet at timestamp\n");
            free(web_packet_list->packets);
            free(web_packet_list);
            return NULL;
        }

        WebAVPacket* web_packet = &web_packet_list->packets[stream_index];

        double packet_timestamp = packet->pts * av_q2d(fmt_ctx->streams[stream_index]->time_base);

        web_packet->keyframe = packet->flags & AV_PKT_FLAG_KEY;
        web_packet->timestamp = packet_timestamp > 0 ? packet_timestamp : 0;
        web_packet->duration = packet->duration * av_q2d(fmt_ctx->streams[stream_index]->time_base);
        web_packet->size = packet->size;
        web_packet->data = malloc(sizeof (uint8_t) * packet->size);
        memcpy(web_packet->data, packet->data, packet->size);
    }

    av_packet_unref(packet);
    av_packet_free(&packet);
    avformat_close_input(&fmt_ctx);

    return web_packet_list;
}

int EMSCRIPTEN_KEEPALIVE read_av_packet(int msg_id, const char *filename, double start, double end, int type, int wanted_stream_nb)
{
    AVFormatContext *fmt_ctx = NULL;
    int ret;

    if ((ret = avformat_open_input(&fmt_ctx, filename, NULL, NULL)) < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot open input file\n");
        avformat_close_input(&fmt_ctx);
        return 0;
    }

    if ((ret = avformat_find_stream_info(fmt_ctx, NULL)) < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot find stream information\n");
        avformat_close_input(&fmt_ctx);
        return 0;
    }

    int stream_index = av_find_best_stream(fmt_ctx, type, wanted_stream_nb, -1, NULL, 0);

    if (stream_index < 0)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot find wanted stream in the input file\n");
        avformat_close_input(&fmt_ctx);
        return 0;
    }

    AVPacket *packet = NULL;
    packet = av_packet_alloc();

    if (!packet)
    {
        av_log(NULL, AV_LOG_ERROR, "Cannot allocate packet\n");
        avformat_close_input(&fmt_ctx);
        return 0;
    }

    if (start > 0)
    {
        int64_t start_timestamp = (int64_t)(start * AV_TIME_BASE);
        int64_t rescaled_start_time_stamp = av_rescale_q(start_timestamp, AV_TIME_BASE_Q, fmt_ctx->streams[stream_index]->time_base);

        if ((ret = av_seek_frame(fmt_ctx, stream_index, rescaled_start_time_stamp, AVSEEK_FLAG_BACKWARD)) < 0)
        {
            av_log(NULL, AV_LOG_ERROR, "Cannot seek to the specified timestamp\n");
            avformat_close_input(&fmt_ctx);
            av_packet_unref(packet);
            av_packet_free(&packet);
            return 0;
        }
    }

    while (av_read_frame(fmt_ctx, packet) >= 0)
    {
        if (packet->stream_index == stream_index)
        {
            if (end > 0)
            {
                int64_t end_timestamp = (int64_t)(end * AV_TIME_BASE);
                int64_t rescaled_end_timestamp = av_rescale_q(end_timestamp, AV_TIME_BASE_Q, fmt_ctx->streams[stream_index]->time_base);

                if (packet->pts > rescaled_end_timestamp) {
                    break;
                }
            }

            if (packet)
            {
                WebAVPacket *web_packet = malloc(sizeof(WebAVPacket));

                double packet_timestamp = packet->pts * av_q2d(fmt_ctx->streams[stream_index]->time_base);

                web_packet->keyframe = packet->flags & AV_PKT_FLAG_KEY;
                web_packet->timestamp = packet_timestamp > 0 ? packet_timestamp : 0; // TODO: some packets have negative pts
                web_packet->duration = packet->duration * av_q2d(fmt_ctx->streams[stream_index]->time_base);
                web_packet->size = packet->size;
                web_packet->data = malloc(sizeof(uint8_t) * packet->size);
                memcpy(web_packet->data, packet->data, packet->size);

                // call js method to send packet
                int send_ret = send_av_packet(msg_id, web_packet);

                if (send_ret == 0)
                {
                    break;
                }
            }
            else
            {
                av_log(NULL, AV_LOG_ERROR, "Failed to get av packet at timestamp\n");
                break;
            }
        }
        av_packet_unref(packet);
    }

    // call js method to end send packet
    send_av_packet(msg_id, NULL);

    avformat_close_input(&fmt_ctx);
    av_packet_unref(packet);
    av_packet_free(&packet);

    return 1;
}