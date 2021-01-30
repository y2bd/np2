import { fetchAlbumArtUrl } from "./lastfm";
import { monthHeaderComponent, ratingComponent } from "./render";
import { ratings } from "./rym";
import { stream } from "./stream";
import config from './config.json';

const ratingsList = document.querySelector("div.ratings");
let lastDate: Date | undefined;

stream(ratings(config.rymProfile)).map(rating => {
  console.log(">>", "Rendering", rating.album);
  const ratingComp = ratingComponent(rating);

  const ratingDate = new Date(rating.dateString!);
  if (!lastDate || ratingDate.getMonth() !== lastDate.getMonth()) {
    const monthHeaderComp = monthHeaderComponent(ratingDate);
    ratingsList?.appendChild(monthHeaderComp.root);
    lastDate = ratingDate;
  }

  ratingsList?.appendChild(ratingComp.root);

  return [rating, ratingComp] as const;
}).map(async ([rating, component]) => {
  console.log(">>", "Fetching big album art for", rating.album);
  let albumArtUrl = window.localStorage.getItem(`album-art-${rating.id}`) ?? "";
  if (!albumArtUrl) {
    albumArtUrl = await fetchAlbumArtUrl(rating) ?? rating.thumbnailUrl;
    window.localStorage.setItem(`album-art-${rating.id}`, albumArtUrl);
  }

  component.update({ 
    thumbnailUrl: albumArtUrl
  });
  
  return component;
});
