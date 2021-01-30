import { RatingInfo } from "./rym";

const ratingsKey = 'ratings-store-v0.1';

export function getLocalRatings(): RatingInfo[] {
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

export function saveLocalRatings(ratings: RatingInfo[]) {
  window.localStorage.setItem(ratingsKey, JSON.stringify(ratings));
}