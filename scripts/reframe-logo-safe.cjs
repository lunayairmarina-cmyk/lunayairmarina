const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.join("public", "images", "New folder", "images");

/**
 * Re-export branded photos so the LM mark sits in the central "safe zone".
 * That way object-cover crops keep the logo visible.
 */
async function saveLogoSafe(inputName, outBases, { width, height, position = "centre" }) {
  const input = path.join(SRC, inputName);
  if (!fs.existsSync(input)) {
    console.warn("missing", inputName);
    return;
  }
  const buf = await sharp(input)
    .rotate()
    .resize(width, height, { fit: "cover", position })
    .toBuffer();

  for (const outBase of outBases) {
    fs.mkdirSync(path.dirname(outBase), { recursive: true });
    await sharp(buf).jpeg({ quality: 88, mozjpeg: true }).toFile(`${outBase}.jpg`);
    await sharp(buf).webp({ quality: 84 }).toFile(`${outBase}.webp`);
    if (outBase.includes("yacht_side_transom") || outBase.includes("about-marina")) {
      await sharp(buf).png({ compressionLevel: 8 }).toFile(`${outBase}.png`);
    }
  }
  console.log("ok", inputName, "→", width, "x", height, position);
}

async function main() {
  // Gallery: logos centered in frame
  await saveLogoSafe(
    "gallery_marina_night.png",
    ["src/assets/gallery/gallery-01-marina", "public/images/gallery/gallery-01-marina"],
    // Tall cells crop vertically — keep yacht+logo mid-right but inside safe zone
    { width: 1200, height: 1600, position: "right" },
  );
  await saveLogoSafe(
    "gallery_white_hull_closeup.png",
    ["src/assets/gallery/gallery-02-deck", "public/images/gallery/gallery-02-deck"],
    { width: 1400, height: 1050, position: "centre" },
  );
  await saveLogoSafe(
    "about_main.png",
    [
      "src/assets/gallery/gallery-03-lounge",
      "public/images/gallery/gallery-03-lounge",
      "src/assets/about/yacht_side_transom_landscape",
      "public/images/about/yacht_side_transom_landscape",
      "src/assets/about/about-marina",
      "public/images/about/about-marina",
    ],
    { width: 1600, height: 1200, position: "centre" },
  );
  await saveLogoSafe(
    "fleet_ocean_overhead_portrait.png",
    ["src/assets/gallery/gallery-04-sunset", "public/images/gallery/gallery-04-sunset"],
    { width: 1400, height: 1050, position: "centre" },
  );
  await saveLogoSafe(
    "gallery_visiting_yacht_arrival.png",
    ["src/assets/gallery/gallery-05-arrival", "public/images/gallery/gallery-05-arrival"],
    { width: 1400, height: 1050, position: "centre" },
  );
  await saveLogoSafe(
    "gallery_professional_crew.png",
    ["src/assets/gallery/gallery-06-crew", "public/images/gallery/gallery-06-crew"],
    { width: 1400, height: 1050, position: "centre" },
  );
  await saveLogoSafe(
    "gallery_harbor_panorama.png",
    ["src/assets/gallery/gallery-07-harbor", "public/images/gallery/gallery-07-harbor"],
    { width: 1600, height: 1000, position: "centre" },
  );
  await saveLogoSafe(
    "service_yacht_management_360.png",
    ["src/assets/gallery/gallery-08-bridge", "public/images/gallery/gallery-08-bridge"],
    { width: 1400, height: 1050, position: "centre" },
  );

  // Services covers — logo-safe center
  await saveLogoSafe(
    "service_yacht_management_360.png",
    [
      "src/assets/services/service-yacht-management",
      "public/images/services/service-yacht-management",
    ],
    { width: 1600, height: 1000, position: "centre" },
  );
  await saveLogoSafe(
    "service_visiting_yacht_agency.png",
    ["src/assets/services/service-yacht-agency", "public/images/services/service-yacht-agency"],
    { width: 1600, height: 1000, position: "centre" },
  );
  await saveLogoSafe(
    "service_marina_management.png",
    ["src/assets/services/service-marina", "public/images/services/service-marina"],
    { width: 1600, height: 1000, position: "centre" },
  );
  await saveLogoSafe(
    "service_crew_management.png",
    ["src/assets/services/service-crew", "public/images/services/service-crew"],
    { width: 1600, height: 1000, position: "centre" },
  );

  // Hero + fleet — keep brand mark mid-frame
  await saveLogoSafe(
    "hero_poster.png",
    ["src/assets/hero/hero-main", "public/images/hero/hero-main"],
    { width: 1920, height: 1080, position: "centre" },
  );
  await saveLogoSafe(
    "fleet_motor_yacht.png",
    ["src/assets/fleet/fleet-01", "public/images/fleet/fleet-01"],
    { width: 1400, height: 1050, position: "centre" },
  );
  await saveLogoSafe(
    "fleet_explorer_yacht.png",
    ["src/assets/fleet/fleet-02", "public/images/fleet/fleet-02"],
    { width: 1400, height: 1050, position: "centre" },
  );
  await saveLogoSafe(
    "fleet_ocean_overhead_portrait.png",
    ["src/assets/fleet/fleet-03", "public/images/fleet/fleet-03"],
    { width: 1400, height: 1050, position: "centre" },
  );

  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
