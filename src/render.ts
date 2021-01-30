import { RatingInfo } from './rym'

export function monthHeaderComponent(initialProps: Date) {
  const container = document.createElement('div');
  container.classList.add('monthHeaderContainer');

  const monthHeader = document.createElement('h1');
  container.appendChild(monthHeader);

  const update = (newProps: Date) => {
    const month = newProps.toLocaleString('default', { month: 'long' });
    const year = newProps.toLocaleString('default', { year: 'numeric' });

    monthHeader.textContent = `${month} ${year}`;
  }

  update(initialProps);

  return {
    root: container,
    update
  };
}

// 😍😊🙂😐
export function ratingComponent(initialProps: RatingInfo) {
  const container = document.createElement('div');
  container.classList.add('ratingContainer');
  
  const description = document.createElement('aside');
  const artist = document.createElement('h1');
  const album = document.createElement('h2');
  description.appendChild(artist);
  description.appendChild(album);
  container.appendChild(description);

  const rating = document.createElement('summary');
  container.appendChild(rating);

  const albumArt = document.createElement('img');
  albumArt.addEventListener('click', () => albumArt.classList.toggle('hidden'));
  container.append(albumArt);

  const update = (newProps: Partial<RatingInfo>) => {
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
  }

  update(initialProps);

  return {
    root: container,
    update
  };
}

function getEmojiRating(ratingString: string) {
  const rating = parseFloat(ratingString);

  if (rating > 4) return '😍';
  if (rating > 3) return '😊';
  if (rating > 2) return '🙂';
  else return '😐'; 
}