FFMPEG_CONFIGURE_ARGS = \
	--target-os=none \
	--arch=x86_32 \
	--cc=emcc \
	--ranlib=emranlib \
	--disable-all \
	--disable-asm \
	--enable-avcodec \
	--enable-avformat \
	--enable-protocol=file \
	--enable-decoder=h264,hevc,vp9,vp8 \
	--enable-demuxer=mov,mp4,m4a,3gp,3g2,mj2,avi,flv,matroska,webm,m4v,mpegts,asf

clean:
	cd lib/FFmpeg && \
	make clean && \
	make distclean

ffmpeg-lib:
	cd lib/FFmpeg && \
	emconfigure ./configure $(FFMPEG_CONFIGURE_ARGS) && \
	emmake make

web-demuxer: 
	emcc ./lib/web-demuxer/*.c \
	-I./lib/FFmpeg \
	-L./lib/FFmpeg/libavformat -lavformat \
	-L./lib/FFmpeg/libavutil -lavutil \
	-L./lib/FFmpeg/libavcodec -lavcodec \
	-o ./src/lib/ffmpeg.js \
	--post-js ./lib/web-demuxer/post.js \
	-lworkerfs.js \
	-O3 \
	-s EXPORT_ES6=1 \
	-s INVOKE_RUN=0 \
	-s ENVIRONMENT=worker \
	-s EXPORTED_RUNTIME_METHODS=cwrap,getValue,UTF8ToString \
	-s EXPORTED_FUNCTIONS=_free \
	-s ASYNCIFY \
  -s ALLOW_MEMORY_GROWTH=1