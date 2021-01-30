import { getLocalRatings, saveLocalRatings } from "./local";
import { Streamer } from "./stream";
import { delay } from "./util";

export type RatingInfo = ReturnType<typeof fetchRatings> extends Promise<Array<infer T>> ? T : never;

export function fetchRatings(profileName: string, page: number) {
  const url = `https://rateyourmusic.com/collection/${profileName}/r0.5-5.0,ss.dd/${page}`;
  return fetch(url)
    .then((response) => response.text())
    .then((htmlText) => {
      const domParser = new DOMParser();
      const document = domParser.parseFromString(htmlText, "text/html");

      const ratingRows = document.querySelectorAll("table.mbgen > tbody > tr");
      const ratings = Array.from(ratingRows)
        .slice(1) // the first row is the table header
        .map((ratingRow) => {
          return {
            thumbnailUrl: ratingRow
              .querySelector("td.or_q_thumb_album a img")
              ?.getAttribute("src"),
            dateString: ratingRow.querySelector("td.or_q_rating_date_d")
              ?.textContent?.trim().replace(/\n/g, ''),
            ratingString: ratingRow
              .querySelector("td.or_q_rating_date_s img")
              ?.getAttribute("title"), // of the format "3.50 stars",
            artist: ratingRow.querySelector("td.or_q_albumartist_td a.artist")
              ?.textContent,
            album: ratingRow.querySelector("td.or_q_albumartist_td a.album")
              ?.textContent,
            releaseUrl: ratingRow.querySelector("td.or_q_albumartist_td a.album")
              ?.getAttribute('href'),
            id: ratingRow.querySelector("td.or_q_rating_date_s span")
              ?.textContent, // of the format [Rating143292656],
          } as const;
        });

      return ratings;
    });
}

export const ratings = (profileName: string, maxPages = 5): Streamer<RatingInfo> => async publish => {
  console.log("Fetching local ratings...");
  const localRatings = getLocalRatings();
  console.log("Found", localRatings.length, "existing local ratings");

  const latestLocalRating: RatingInfo | undefined = localRatings[0];

  const newRatings: RatingInfo[] = [];
  for (let page = 1; page <= maxPages; page++) {
    console.log(">", "Fetching page", page, "of external ratings...");
    const fetchedRatings = await fetchRatings(profileName, page);
    console.log(">", "Fetched", fetchedRatings.length, "external ratings");

    let foundMatchingLatestLocalRating = false;
    for (const fetchedRating of fetchedRatings) {
      if (fetchedRating.id === latestLocalRating?.id) {
        console.log(
          ">>", 
          "External rating for",
          fetchedRating.album,
          "was already found in local cache, ending external fetch"
        );
        foundMatchingLatestLocalRating = true;
        break;
      } else {
        console.log(">>", "Publishing rating for", fetchedRating.album);
        publish(fetchedRating);
        newRatings.push(fetchedRating);

        console.log(">>", "Waiting one second");
        await delay(200);
      }
    }

    if (foundMatchingLatestLocalRating) {
      break;
    }

    console.log(">", "Waiting ten seconds...");
    await delay(10000);
  }

  console.log("Publishing", localRatings.length, "remaining local ratings");
  publish(...localRatings);

  console.log(
    "Saving",
    newRatings.length + localRatings.length,
    "ratings to local cache"
  );
  saveLocalRatings([...newRatings, ...localRatings]);
}