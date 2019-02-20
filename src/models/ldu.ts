export enum DataType {
  msword = 'msword',
  ogg = 'ogg',
  pdf = 'pdf',
  excel = 'excel',
  powerpoint = 'powerpoint',
  zip = 'zip',
  audio_mpeg = 'audio_mpeg',
  audio_vorbis = 'audio_vorbis',
  image_bmp = 'image_bmp',
  image_gif = 'image_gif',
  image_geotiff = 'image_geotiff',
  image_jpeg = 'image_jpeg',
  image_png = 'image_png',
  json = 'json',
  geojson = 'geojson',
  text_plain = 'text_plain',
  video_mpeg = 'video_mpeg',
  video_msvideo = 'video_msvideo',
  video_avi = 'video_avi',
  netcdf = 'netcdf',
  wms = 'wms',
  wfs = 'wfs',
  other = 'other'
}

export interface ILargeDataUpdate {
  url: string;
  title?: null | undefined | string;
  description?: null | undefined | string;
  dataType: DataType;
}
