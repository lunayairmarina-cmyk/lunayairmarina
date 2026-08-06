import yacht1 from "@/assets/fleet/fleet-01.jpg";
import yacht2 from "@/assets/fleet/fleet-02.jpg";
import aboutMarina from "@/assets/about/yacht_lunaiyar.png";
import gallery1 from "@/assets/gallery/gallery-01-marina.jpg";
import gallery2 from "@/assets/gallery/gallery-02-deck.jpg";
import gallery3 from "@/assets/gallery/gallery-03-lounge.jpg";

export const SERVICE_SLUGS = [
  "yacht-management-360",
  "visiting-yacht-agency",
  "marina-management",
  "crew-management",
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export interface ServiceDefinition {
  slug: ServiceSlug;
  coverImage: string;
  gallery: { src: string; captionKey: string }[];
}

export const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    slug: "yacht-management-360",
    coverImage: yacht1,
    gallery: [
      { src: aboutMarina, captionKey: "g1" },
      { src: gallery1, captionKey: "g2" },
      { src: gallery2, captionKey: "g3" },
    ],
  },
  {
    slug: "visiting-yacht-agency",
    coverImage: yacht2,
    gallery: [
      { src: gallery2, captionKey: "g1" },
      { src: aboutMarina, captionKey: "g2" },
      { src: gallery3, captionKey: "g3" },
    ],
  },
  {
    slug: "marina-management",
    coverImage: aboutMarina,
    gallery: [
      { src: gallery3, captionKey: "g1" },
      { src: yacht2, captionKey: "g2" },
      { src: gallery1, captionKey: "g3" },
    ],
  },
  {
    slug: "crew-management",
    coverImage: gallery3,
    gallery: [
      { src: yacht1, captionKey: "g1" },
      { src: gallery2, captionKey: "g2" },
      { src: aboutMarina, captionKey: "g3" },
    ],
  },
];

export function getServiceBySlug(slug: string) {
  return SERVICE_DEFINITIONS.find((item) => item.slug === slug) ?? null;
}

export function isServiceSlug(value: string): value is ServiceSlug {
  return SERVICE_SLUGS.includes(value as ServiceSlug);
}
