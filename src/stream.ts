export type Mapper<T, U> = (value: T) => U;
export type Publisher<T> = (...results: T[]) => void;
export type Streamer<T> = (publisher: Publisher<T>) => void | Promise<void>;

export const stream = <T>(streamer: Streamer<T>) => {
  const streamerStr = Math.random().toString();
  streamer((...results) =>
    dispatchEvent(new CustomEvent(streamerStr, { detail: results }))
  );

  return {
    map: <U>(mapper: Mapper<T, U>) => {
      return stream<U>((publish) => {
        addEventListener(streamerStr, (evt) => {
          const results = (evt as CustomEvent).detail as T[];
          results.forEach((result) => result && publish(mapper(result)));
        });
      });
    },
  };
};
