export enum DataType {
  msword,
  ogg,
  pdf,
  excel,
  powerpoint,
  zip,
  audio_mpeg,
  audio_vorbis,
  image_bmp,
  image_gif,
  image_geotiff,
  image_jpeg,
  image_png,
  json,
  geojson,
  text_plain,
  video_mpeg,
  video_msvideo,
  video_avi,
  netcdf,
  other
}

export interface ILargeDataUpdate {
  url: string;
  title?: null | undefined | string;
  description?: null | undefined | string;
  dataType: DataType;
}
