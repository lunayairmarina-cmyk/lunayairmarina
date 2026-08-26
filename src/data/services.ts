import serviceYachtMgmt from "@/assets/services/service-yacht-management.jpg";
import serviceAgency from "@/assets/services/service-yacht-agency.jpg";
import serviceMarina from "@/assets/services/service-marina.jpg";
import serviceCrew from "@/assets/services/service-crew.jpg";
import aboutMarina from "@/assets/about/yacht_side_transom_landscape.png";
import gallery1 from "@/assets/gallery/gallery-01-marina.jpg";
import gallery2 from "@/assets/gallery/gallery-02-deck.jpg";
import gallery6 from "@/assets/gallery/gallery-06-crew.jpg";
import gallery5 from "@/assets/gallery/gallery-05-arrival.jpg";
import gallery8 from "@/assets/gallery/gallery-08-bridge.jpg";
import { SERVICE_SLUGS, type ServiceSlug } from "@/data/serviceSlugs";

export { SERVICE_SLUGS, type ServiceSlug };

export interface ServiceDefinition {
  slug: ServiceSlug;
  coverImage: string;
  gallery: { src: string; captionKey: string }[];
}

export const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    slug: "yacht-management-360",
    coverImage: serviceYachtMgmt,
    gallery: [
      { src: aboutMarina, captionKey: "g1" },
      { src: gallery1, captionKey: "g2" },
      { src: gallery8, captionKey: "g3" },
    ],
  },
  {
    slug: "visiting-yacht-agency",
    coverImage: serviceAgency,
    gallery: [
      { src: gallery5, captionKey: "g1" },
      { src: aboutMarina, captionKey: "g2" },
      { src: gallery2, captionKey: "g3" },
    ],
  },
  {
    slug: "marina-management",
    coverImage: serviceMarina,
    gallery: [
      { src: gallery1, captionKey: "g1" },
      { src: gallery2, captionKey: "g2" },
      { src: serviceMarina, captionKey: "g3" },
    ],
  },
  {
    slug: "crew-management",
    coverImage: serviceCrew,
    gallery: [
      { src: gallery6, captionKey: "g1" },
      { src: serviceYachtMgmt, captionKey: "g2" },
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
