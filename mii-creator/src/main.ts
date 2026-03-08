import Mii from "./external/mii-js/mii";
import { Buffer as Buf } from "../node_modules/buffer/index";
import { setupUi } from "./ui/setup";
import { MiiEditor } from "./class/MiiEditor";
import LazyLoad, { type ILazyLoadInstance } from "vanilla-lazyload";
import { langManager } from "./l10n/manager";
import { Config } from "./config";

declare global {
  interface Window {
    buffer: Buf;
    editor: MiiEditor;
    firstVisit: boolean;
    LazyLoad: ILazyLoadInstance;
    localforage: LocalForage;
    Mii: any;
    mii: Mii;
    sentryOnLoad: any;
  }
}

//@ts-expect-error Buffer to keep in window for debugging purposes
window.buffer = Buf;

window.LazyLoad = new LazyLoad();

langManager.getString("languages.en_US");
setupUi();
