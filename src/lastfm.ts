import { RatingInfo } from "./rym";
import config from './config.json';

export async function fetchAlbumArtUrl({ artist, album, thumbnailUrl }: RatingInfo) {
  const eArtist = encodeURIComponent(artist ?? "");
  const eAlbum = encodeURIComponent(album ?? "");
  const apiUrl =
    `http://ws.audioscrobbler.com/2.0/?method=album.getinfo` +
    `&api_key=${config.lastFmApiKey}&artist=${eArtist}&album=${eAlbum}&autocorrect=1&format=json`;

  const rawResponse = await fetch(apiUrl);
  const jsonResponse = await rawResponse.json();
  if (jsonResponse.error) {
    return thumbnailUrl;
  } else {
    const imgs = jsonResponse.album.image;
    const bestImage = imgs[imgs.length - 1]["#text"];
    return bestImage ?? thumbnailUrl;
  }
}
