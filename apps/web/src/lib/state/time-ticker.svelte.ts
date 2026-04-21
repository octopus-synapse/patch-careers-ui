import { browser } from '$app/environment';

let now = $state(Date.now());

if (browser) {
  setInterval(() => {
    now = Date.now();
  }, 60_000);
}

export const timeTicker = {
  get now() {
    return now;
  },
};
