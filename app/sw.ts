import { Serwist } from "serwist";

declare const self: {
    __SW_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    runtimeCaching: [],
    skipWaiting: true,
    clientsClaim: true,
});

serwist.addEventListeners();
