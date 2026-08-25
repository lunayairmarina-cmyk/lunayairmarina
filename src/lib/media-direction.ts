/**
 * Hero/header photos are composed for text on one side.
 * - "rtl": subject opposite Arabic text-start (mirror under LTR)
 * - "ltr": subject opposite English text-start (mirror under RTL)
 * - "neutral": never mirror (centered / no directional composition)
 */
export type MediaComposition = "rtl" | "ltr" | "neutral";

/** CSS class applied to the image/video layer only — see styles.css */
export function mediaDirectionClass(composition: MediaComposition = "rtl") {
  if (composition === "rtl") return "media-mirror-for-ltr";
  if (composition === "ltr") return "media-mirror-for-rtl";
  return undefined;
}
