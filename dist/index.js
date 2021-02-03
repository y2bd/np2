(() => {
  // src/config.json
  var rymProfile = "y2bd";
  var lastFmApiKey = "7f87d000a5c717ff936069c4324183d4";
  var __help__ = "fill in your details and remove the .template";
  var config_default = {
    rymProfile,
    lastFmApiKey,
    __help__
  };

  // src/lastfm.ts
  async function fetchAlbumArtUrl({artist, album, thumbnailUrl}) {
    const eArtist = encodeURIComponent(artist ?? "");
    const eAlbum = encodeURIComponent(album ?? "");
    const apiUrl = `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${config_default.lastFmApiKey}&artist=${eArtist}&album=${eAlbum}&autocorrect=1&format=json`;
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

  // src/render.ts
  function monthHeaderComponent(initialProps) {
    const container = document.createElement("div");
    container.classList.add("monthHeaderContainer");
    const monthHeader = document.createElement("h1");
    container.appendChild(monthHeader);
    const update = (newProps) => {
      const month = newProps.toLocaleString("default", {month: "long"});
      const year = newProps.toLocaleString("default", {year: "numeric"});
      monthHeader.textContent = `${month} ${year}`;
    };
    update(initialProps);
    return {
      root: container,
      update
    };
  }
  function ratingComponent(initialProps) {
    const container = document.createElement("div");
    container.classList.add("ratingContainer");
    const description = document.createElement("aside");
    const artist = document.createElement("h1");
    const album = document.createElement("h2");
    description.appendChild(artist);
    description.appendChild(album);
    container.appendChild(description);
    const rating = document.createElement("summary");
    container.appendChild(rating);
    const albumArt = document.createElement("img");
    albumArt.addEventListener("click", () => albumArt.classList.toggle("hidden"));
    container.append(albumArt);
    const update = (newProps) => {
      if (newProps.album) {
        album.textContent = newProps.album;
      }
      if (newProps.artist) {
        artist.textContent = newProps.artist;
      }
      if (newProps.ratingString) {
        rating.textContent = getEmojiRating(newProps.ratingString);
      }
      if (newProps.thumbnailUrl) {
        albumArt.src = newProps.thumbnailUrl;
      }
    };
    update(initialProps);
    return {
      root: container,
      update
    };
  }
  function getEmojiRating(ratingString) {
    const rating = parseFloat(ratingString);
    if (rating > 4)
      return "\u{1F60D}";
    if (rating > 3)
      return "\u{1F60A}";
    if (rating > 2)
      return "\u{1F642}";
    else
      return "\u{1F610}";
  }

  // src/local.ts
  var ratingsKey = "ratings-store-v0.1";
  function getLocalRatings() {
    const localRatings = window.localStorage.getItem(ratingsKey);
    if (!localRatings) {
      return [];
    }
    try {
      return JSON.parse(localRatings);
    } catch {
      return [];
    }
  }
  function saveLocalRatings(ratings2) {
    window.localStorage.setItem(ratingsKey, JSON.stringify(ratings2));
  }

  // src/util.ts
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // src/rym.ts
  function fetchRatings(profileName, page) {
    const url = `https://holy-star-bc5b.arewecoolyet.workers.dev/collection/${profileName}/r0.5-5.0,ss.dd/${page}`;
    return fetch(url).then((response) => response.text()).then((htmlText) => {
      const domParser = new DOMParser();
      const document2 = domParser.parseFromString(htmlText, "text/html");
      const ratingRows = document2.querySelectorAll("table.mbgen > tbody > tr");
      const ratings2 = Array.from(ratingRows).slice(1).map((ratingRow) => {
        return {
          thumbnailUrl: ratingRow.querySelector("td.or_q_thumb_album a img")?.getAttribute("src"),
          dateString: ratingRow.querySelector("td.or_q_rating_date_d")?.textContent?.trim().replace(/\n/g, ""),
          ratingString: ratingRow.querySelector("td.or_q_rating_date_s img")?.getAttribute("title"),
          artist: ratingRow.querySelector("td.or_q_albumartist_td a.artist")?.textContent,
          album: ratingRow.querySelector("td.or_q_albumartist_td a.album")?.textContent,
          releaseUrl: ratingRow.querySelector("td.or_q_albumartist_td a.album")?.getAttribute("href"),
          id: ratingRow.querySelector("td.or_q_rating_date_s span")?.textContent
        };
      });
      return ratings2;
    });
  }
  var ratings = (profileName, maxPages = 5) => async (publish) => {
    console.log("Fetching local ratings...");
    const localRatings = getLocalRatings();
    console.log("Found", localRatings.length, "existing local ratings");
    const latestLocalRating = localRatings[0];
    const newRatings = [];
    for (let page = 1; page <= maxPages; page++) {
      console.log(">", "Fetching page", page, "of external ratings...");
      const fetchedRatings = await fetchRatings(profileName, page);
      console.log(">", "Fetched", fetchedRatings.length, "external ratings");
      let foundMatchingLatestLocalRating = false;
      for (const fetchedRating of fetchedRatings) {
        if (fetchedRating.id === latestLocalRating?.id) {
          console.log(">>", "External rating for", fetchedRating.album, "was already found in local cache, ending external fetch");
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
      await delay(1e4);
    }
    console.log("Publishing", localRatings.length, "remaining local ratings");
    publish(...localRatings);
    console.log("Saving", newRatings.length + localRatings.length, "ratings to local cache");
    saveLocalRatings([...newRatings, ...localRatings]);
  };

  // src/stream.ts
  var stream = (streamer) => {
    const streamerStr = Math.random().toString();
    streamer((...results) => dispatchEvent(new CustomEvent(streamerStr, {detail: results})));
    return {
      map: (mapper) => {
        return stream((publish) => {
          addEventListener(streamerStr, (evt) => {
            const results = evt.detail;
            results.forEach((result) => result && publish(mapper(result)));
          });
        });
      }
    };
  };

  // src/index.ts
  var ratingsList = document.querySelector("div.ratings");
  var lastDate;
  stream(ratings(config_default.rymProfile)).map((rating) => {
    console.log(">>", "Rendering", rating.album);
    const ratingComp = ratingComponent(rating);
    const ratingDate = new Date(rating.dateString);
    if (!lastDate || ratingDate.getMonth() !== lastDate.getMonth()) {
      const monthHeaderComp = monthHeaderComponent(ratingDate);
      ratingsList?.appendChild(monthHeaderComp.root);
      lastDate = ratingDate;
    }
    ratingsList?.appendChild(ratingComp.root);
    return [rating, ratingComp];
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
})();
