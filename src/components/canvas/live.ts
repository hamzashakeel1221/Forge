import { siteConfig } from "@/config/site.config";
import { lookFrom } from "./product/look";

/** The main product's live colourway, damped toward the store's selected colourway each frame. */
export const mainLook = lookFrom(siteConfig.colorways[0]);
