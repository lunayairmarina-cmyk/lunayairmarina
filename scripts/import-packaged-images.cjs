const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.join("public", "images", "New folder", "images");

async function save(inputName, outBase, { width, height }) {
  const input = path.join(SRC, inputName);
  if (!fs.existsSync(input)) {
    console.warn("missing", inputName);
    return;
  }
  const dir = path.dirname(outBase);
  fs.mkdirSync(dir, { recursive: true });
  const buf = await sharp(input)
    .rotate()
    .resize(width, height, { fit: "cover", position: "centre" })
    .toBuffer();
  await sharp(buf).jpeg({ quality: 88, mozjpeg: true }).toFile(`${outBase}.jpg`);
  await sharp(buf).webp({ quality: 84 }).toFile(`${outBase}.webp`);
  // Keep png only when callers import .png
  if (outBase.includes("yacht_side_transom") || outBase.includes("about-marina")) {
    await sharp(buf).png({ compressionLevel: 8 }).toFile(`${outBase}.png`);
  }
  console.log("ok", outBase);
}

async function main() {
  const jobs = [
    // Hero
    ["hero_poster.png", "src/assets/hero/hero-main", { width: 1920, height: 1080 }],
    ["hero_poster.png", "public/images/hero/hero-main", { width: 1920, height: 1080 }],

    // About
    [
      "about_main.png",
      "src/assets/about/yacht_side_transom_landscape",
      { width: 1600, height: 1200 },
    ],
    [
      "about_main.png",
      "public/images/about/yacht_side_transom_landscape",
      { width: 1600, height: 1200 },
    ],
    ["about_main.png", "src/assets/about/about-marina", { width: 1600, height: 1200 }],
    ["about_main.png", "public/images/about/about-marina", { width: 1600, height: 1200 }],

    // Headers (ultrawide pack — safe text margins L/R)
    [
      "../header_about_ultrawide.png",
      "src/assets/headers/header-about",
      { width: 1920, height: 640 },
    ],
    [
      "../header_about_ultrawide.png",
      "public/images/headers/header-about",
      { width: 1920, height: 640 },
    ],
    [
      "../header_services_ultrawide.png",
      "src/assets/headers/header-services",
      { width: 1920, height: 640 },
    ],
    [
      "../header_services_ultrawide.png",
      "public/images/headers/header-services",
      { width: 1920, height: 640 },
    ],
    [
      "../header_blog_ultrawide_clean.png",
      "src/assets/headers/header-blog",
      { width: 1920, height: 640 },
    ],
    [
      "../header_blog_ultrawide_clean.png",
      "public/images/headers/header-blog",
      { width: 1920, height: 640 },
    ],
    [
      "../header_contact_ultrawide.png",
      "src/assets/headers/header-contact",
      { width: 1920, height: 640 },
    ],
    [
      "../header_contact_ultrawide.png",
      "public/images/headers/header-contact",
      { width: 1920, height: 640 },
    ],

    // Services (prefer the numbered/named final versions)
    [
      "service_yacht_management_360.png",
      "src/assets/services/service-yacht-management",
      { width: 1600, height: 1000 },
    ],
    [
      "service_yacht_management_360.png",
      "public/images/services/service-yacht-management",
      { width: 1600, height: 1000 },
    ],
    [
      "service_visiting_yacht_agency.png",
      "src/assets/services/service-yacht-agency",
      { width: 1600, height: 1000 },
    ],
    [
      "service_visiting_yacht_agency.png",
      "public/images/services/service-yacht-agency",
      { width: 1600, height: 1000 },
    ],
    [
      "service_marina_management.png",
      "src/assets/services/service-marina",
      { width: 1600, height: 1000 },
    ],
    [
      "service_marina_management.png",
      "public/images/services/service-marina",
      { width: 1600, height: 1000 },
    ],
    [
      "service_crew_management.png",
      "src/assets/services/service-crew",
      { width: 1600, height: 1000 },
    ],
    [
      "service_crew_management.png",
      "public/images/services/service-crew",
      { width: 1600, height: 1000 },
    ],

    // Gallery
    [
      "gallery_marina_night.png",
      "src/assets/gallery/gallery-01-marina",
      { width: 1400, height: 1050 },
    ],
    [
      "gallery_marina_night.png",
      "public/images/gallery/gallery-01-marina",
      { width: 1400, height: 1050 },
    ],
    [
      "gallery_white_hull_closeup.png",
      "src/assets/gallery/gallery-02-deck",
      { width: 1400, height: 1050 },
    ],
    [
      "gallery_white_hull_closeup.png",
      "public/images/gallery/gallery-02-deck",
      { width: 1400, height: 1050 },
    ],
    ["about_main.png", "src/assets/gallery/gallery-03-lounge", { width: 1400, height: 1050 }],
    ["about_main.png", "public/images/gallery/gallery-03-lounge", { width: 1400, height: 1050 }],
    [
      "fleet_ocean_overhead_portrait.png",
      "src/assets/gallery/gallery-04-sunset",
      { width: 1600, height: 1000 },
    ],
    [
      "fleet_ocean_overhead_portrait.png",
      "public/images/gallery/gallery-04-sunset",
      { width: 1600, height: 1000 },
    ],
    [
      "gallery_visiting_yacht_arrival.png",
      "src/assets/gallery/gallery-05-arrival",
      { width: 1400, height: 1050 },
    ],
    [
      "gallery_visiting_yacht_arrival.png",
      "public/images/gallery/gallery-05-arrival",
      { width: 1400, height: 1050 },
    ],
    [
      "gallery_professional_crew.png",
      "src/assets/gallery/gallery-06-crew",
      { width: 1400, height: 1050 },
    ],
    [
      "gallery_professional_crew.png",
      "public/images/gallery/gallery-06-crew",
      { width: 1400, height: 1050 },
    ],
    [
      "gallery_harbor_panorama.png",
      "src/assets/gallery/gallery-07-harbor",
      { width: 1600, height: 900 },
    ],
    [
      "gallery_harbor_panorama.png",
      "public/images/gallery/gallery-07-harbor",
      { width: 1600, height: 900 },
    ],
    [
      "service_yacht_management_360.png",
      "src/assets/gallery/gallery-08-bridge",
      { width: 1400, height: 1050 },
    ],
    [
      "service_yacht_management_360.png",
      "public/images/gallery/gallery-08-bridge",
      { width: 1400, height: 1050 },
    ],

    // Fleet
    ["fleet_motor_yacht.png", "src/assets/fleet/fleet-01", { width: 1400, height: 1050 }],
    ["fleet_motor_yacht.png", "public/images/fleet/fleet-01", { width: 1400, height: 1050 }],
    ["fleet_explorer_yacht.png", "src/assets/fleet/fleet-02", { width: 1400, height: 1050 }],
    ["fleet_explorer_yacht.png", "public/images/fleet/fleet-02", { width: 1400, height: 1050 }],
    [
      "fleet_ocean_overhead_portrait.png",
      "src/assets/fleet/fleet-03",
      { width: 1400, height: 1050 },
    ],
    [
      "fleet_ocean_overhead_portrait.png",
      "public/images/fleet/fleet-03",
      { width: 1400, height: 1050 },
    ],

    // Admin login bg from about header mood
    ["header_about.png", "src/assets/admin/admin-login-bg", { width: 1920, height: 1080 }],
    ["header_about.png", "public/images/admin/admin-login-bg", { width: 1920, height: 1080 }],

    // OG from hero
    ["hero_poster.png", "public/images/seo/og-cover", { width: 1200, height: 630 }],
    ["hero_poster.png", "public/og-cover", { width: 1200, height: 630 }],
  ];

  for (const [file, out, size] of jobs) {
    await save(file, out, size);
  }

  // PNG OG as well
  const ogSrc = path.join(SRC, "hero_poster.png");
  if (fs.existsSync(ogSrc)) {
    await sharp(ogSrc).resize(1200, 630, { fit: "cover" }).png().toFile("public/og-image.png");
    console.log("ok public/og-image.png");
  }

  console.log("all done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
