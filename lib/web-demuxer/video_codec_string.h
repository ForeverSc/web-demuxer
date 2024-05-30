#include "libavformat/avformat.h"

void set_avc_codec_string(char* str, size_t str_size, AVCodecParameters* par);
void set_hevc_codec_string(char* str, size_t str_size, AVCodecParameters* par);
void set_av1_codec_string(char *str, size_t str_size, AVCodecParameters *par);
void set_vp9_codec_string(char *str, size_t str_size, AVCodecParameters *par, AVRational *frame_rate);

void set_video_codec_string(char *str, size_t str_size, AVCodecParameters *par, AVRational *frame_rate);