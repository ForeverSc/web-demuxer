/**
 * sync with ffmpeg libavutil/avutil.h
 */
export enum AVMediaType {
  AVMEDIA_TYPE_UNKNOWN = -1, ///< Usually treated as AVMEDIA_TYPE_DATA
  AVMEDIA_TYPE_VIDEO,
  AVMEDIA_TYPE_AUDIO,
  AVMEDIA_TYPE_DATA, ///< Opaque data information usually continuous
  AVMEDIA_TYPE_SUBTITLE,
  AVMEDIA_TYPE_ATTACHMENT, ///< Opaque data information usually sparse
  AVMEDIA_TYPE_NB,
}

export enum AVLogLevel {
  /**
   * Print no output.
   */
  AV_LOG_QUIET = -8,
  /**
   * Something went really wrong and we will crash now.
   */
  AV_LOG_PANIC = 0,
  /**
   * Something went wrong and recovery is not possible.
   * For example, no header was found for a format which depends
   * on headers or an illegal combination of parameters is used.
   */
  AV_LOG_FATAL = 8,
  /**
   * Something went wrong and cannot losslessly be recovered.
   * However, not all future data is affected.
   */
  AV_LOG_ERROR = 16,
  /**
   * Something somehow does not look correct. This may or may not
   * lead to problems. An example would be the use of '-vstrict -2'.
   */
  AV_LOG_WARNING = 24,
  /**
   * Standard information.
   */
  AV_LOG_INFO = 32,
  /**
   * Detailed information.
   */
  AV_LOG_VERBOSE = 40,
  /**
   * Stuff which is only useful for libav* developers.
   */
  AV_LOG_DEBUG = 48,
  /**
   * Extremely verbose debugging, useful for libav* development.
   */
  AV_LOG_TRACE = 56,
}
