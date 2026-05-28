// seedProducts.ts — Seeds the Product table with all GDrive assets.
// Each character/weapon has 3 tier prices: priceMesh, priceStandard, priceFull.
// The buyer UI shows all 3 and lets the buyer choose their tier before buying.
// Run: npx tsx prisma/seedProducts.ts

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function gd(id: string) { return `/api/drive-video?id=${id}`; }
function gimg(id: string) { return `/api/drive-video?id=${id}`; }

// ── Pricing reference ──────────────────────────────────────────────────────
//
// CHARACTERS
//   Entry  (Orc-01–03):   Mesh ₱699  | Standard ₱1,499 | Full ₱2,499
//   Mid    (Orc-04–07):   Mesh ₱799  | Standard ₱1,699 | Full ₱2,799
//   High   (Orc-08–11):   Mesh ₱899  | Standard ₱1,899 | Full ₱2,999
//   Premium(Orc-12):      Mesh ₱999  | Standard ₱1,999 | Full ₱3,299
//   Legend (Orc-13):      Mesh ₱999  | Standard ₱1,999 | Full ₱3,499
//   Cyborg (Cyborg-01–06):Mesh ₱899  | Standard ₱1,899 | Full ₱3,199
//
// WEAPONS
//   Entry  (Axe-01–02, Hammer-01):         Mesh ₱499 | Standard ₱999
//   Mid    (Axe-03–07, Sword-01–04):       Mesh ₱599 | Standard ₱1,199
//   Mid+   (Hammer-02):                    Mesh ₱599 | Standard ₱1,199
//   High   (Axe-08):                       Mesh ₱799 | Standard ₱1,599
//
// ARCH / INTERIOR / EXTERIOR / TIMELAPSE — single price, no tiers
// ──────────────────────────────────────────────────────────────────────────

const products = [

  // ══════════════════════════════════════════════════════════════════════
  //  CHARACTERS — ORC SERIES (Entry: Orc-01–03)
  // ══════════════════════════════════════════════════════════════════════

  {
    name:            "Orc-01",
    description:     "Low-poly orc warrior. Clean Blender topology, 4K PBR textures. OBJ + FBX included. No rig — ideal for background NPCs and static props.",
    price:           2499,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Orc-02",
    description:     "Heavy orc warrior built for front-line combat roles. Broad silhouette, chunky armor design. OBJ + FBX, 4K PBR textures.",
    price:           2499,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1SaHl7fGvD2uoy34clB1p2UWT-knWENwl"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1SaHl7fGvD2uoy34clB1p2UWT-knWENwl"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Orc-03",
    description:     "Tribal orc with hand-painted detail and bone accessories. OBJ + FBX, 4K PBR textures. Great for cutscenes and environment dressing.",
    price:           2499,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },

  // ══════════════════════════════════════════════════════════════════════
  //  CHARACTERS — ORC SERIES (Mid: Orc-04–07)
  // ══════════════════════════════════════════════════════════════════════

  {
    name:            "Orc-04",
    description:     "Battle-scarred orc veteran with chipped armor and war paint. OBJ + FBX, 4K PBR. High detail for close-up renders and game cinematics.",
    price:           2799,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1cx2sETIft3K7R8NnNPumoLet1pW5It0a"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1cx2sETIft3K7R8NnNPumoLet1pW5It0a"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Orc-05",
    description:     "Shaman orc with ceremonial armor and skull trophies. OBJ + FBX, 4K PBR. Detailed bone accessories and layered cloth.",
    price:           2799,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("13y5Ixc4gOLRjQM7yNpJPFf9_p1O-5YPX"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("13y5Ixc4gOLRjQM7yNpJPFf9_p1O-5YPX"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Orc-06",
    description:     "Armored guard orc — tower shield, full plate. OBJ + FBX, 4K PBR. Designed for defensive tank roles and city gate encounters.",
    price:           2799,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1fQJZ68HEZK6hh7k1nmtl2DUAKQBf5-mT"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1fQJZ68HEZK6hh7k1nmtl2DUAKQBf5-mT"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Orc-07",
    description:     "Berserker orc — unarmored, rage-fueled, primal energy. OBJ + FBX, 4K PBR. Dynamic silhouette built for fast attack animations.",
    price:           2799,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("16-RCaA3WjQjMf1GT0Ad2JrjAhR-U_FyH"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("16-RCaA3WjQjMf1GT0Ad2JrjAhR-U_FyH"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },

  // ══════════════════════════════════════════════════════════════════════
  //  CHARACTERS — ORC SERIES (High: Orc-08–11)
  // ══════════════════════════════════════════════════════════════════════

  {
    name:            "Orc-08",
    description:     "Elite orc commander. Fully rigged FBX. 4K PBR textures. Ready for Unity and Unreal. Standard tier includes Idle, Walk, Attack 1.",
    price:           2999,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1Wjgt2RcRkUrbxEMnLQWWdiUdQ3OHwpx3"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1Wjgt2RcRkUrbxEMnLQWWdiUdQ3OHwpx3"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Orc-09",
    description:     "Scout orc built for speed and stealth. Fully rigged FBX. Animations: Idle, Walk, Attack 1. 4K PBR textures. Unity/Unreal ready.",
    price:           2999,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1JB-kYyq0XMrPe0pgrh5L2S-nGmK-wvXE"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1JB-kYyq0XMrPe0pgrh5L2S-nGmK-wvXE"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Orc-10",
    description:     "Orc warchief with elaborate horned crown and layered armor. Fully rigged FBX. Animations: Idle, Walk, Attack 1. 4K PBR. Unity/Unreal compatible.",
    price:           2999,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1q3rW69QWjYEK5T53rRTpTFlR7X9ZERRe"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1q3rW69QWjYEK5T53rRTpTFlR7X9ZERRe"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Orc-11",
    description:     "Siege orc built to break walls — heavy plate and giant pauldrons. Fully rigged FBX. Animations: Idle, Walk, Ground Slam. 4K PBR. Unity/Unreal ready.",
    price:           2999,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1CTk71XmBB9yNz9Osbfd-YHg9mrsgmZkf"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1CTk71XmBB9yNz9Osbfd-YHg9mrsgmZkf"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },

  // ══════════════════════════════════════════════════════════════════════
  //  CHARACTERS — ORC SERIES (Premium: Orc-12, Legendary: Orc-13)
  // ══════════════════════════════════════════════════════════════════════

  {
    name:            "Orc-12",
    description:     "Dark shaman orc — glowing rune engravings, tattered robes, bone staff. Full pack: OBJ + FBX rigged + face PNG. Animation slots ready. 4K PBR.",
    price:           3299,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1ZPSoWhJc0ukVny9sCKp0-ytzTsz0aL50"),
    facePngUrl:      gimg("1ai8U8_LmCzgaZHITTUJ9J6FEUjUdwE61"),
    threeDUrl:       null,
    actionOneUrl:    gd("1ZPSoWhJc0ukVny9sCKp0-ytzTsz0aL50"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Orc-13",
    description:     "Legendary orc hero — apex of the orc series. Full cinematic quality, intricate gold-and-iron armor. Full pack: OBJ + FBX rigged + face PNG. 4K PBR.",
    price:           3499,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1W1eHcST6_noKH3VCygvpKz-JFZkCF6Su"),
    facePngUrl:      gimg("1uRu_SW840F9l8UqHlLYh85d60z91qQWM"),
    threeDUrl:       null,
    actionOneUrl:    gd("1W1eHcST6_noKH3VCygvpKz-JFZkCF6Su"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },

  // ══════════════════════════════════════════════════════════════════════
  //  WEAPONS — AXE SERIES
  // ══════════════════════════════════════════════════════════════════════

  {
    name:            "Axe-01",
    description:     "Standard battle axe — single blade, iron head, hardwood haft. Clean PBR textures. OBJ + FBX. Ideal for warrior and grunt inventory systems.",
    price:           999,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Axe-02",
    description:     "Dual-blade axe with mirrored crescent heads and wrapped grip. OBJ + FBX, 4K PBR. Good for high-tier loot tables and elite enemies.",
    price:           999,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Axe-03",
    description:     "Ornate ceremonial axe with engraved runes and gold inlay. OBJ + FBX, 4K PBR. Perfect for quest reward weapons and hero character loadouts.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Axe-04",
    description:     "Heavy war axe — oversized blade for two-handed wielding. OBJ + FBX, 4K PBR. Designed for slow, devastating overhead attack animations.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1jjU-r5EawMDjzhbJueiadCMjkcCZrHtr"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1jjU-r5EawMDjzhbJueiadCMjkcCZrHtr"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Axe-05",
    description:     "Rune-carved axe with glowing blue engravings and ember texture detail. OBJ + FBX, 4K PBR. High visual impact for magic-class builds.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1vl3KhBI_UQIugyIXeBTduabrOh0eZSU5"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1vl3KhBI_UQIugyIXeBTduabrOh0eZSU5"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Axe-06",
    description:     "Berserker axe — jagged edge, dark iron, blood-stained texture. OBJ + FBX, 4K PBR. High-detail close-up geometry for first-person game views.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1DcmVwUgfOzvl8wzJJOq-YP7pR_8ZXZ4u"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1DcmVwUgfOzvl8wzJJOq-YP7pR_8ZXZ4u"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Axe-07",
    description:     "Twin axe set — matched pair with worn leather grip and chain link connector. OBJ + FBX, 4K PBR. Designed for dual-wield combat builds.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1k9AhDcIY-Em7Wyl5fd2i79DomElK1DnM"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1k9AhDcIY-Em7Wyl5fd2i79DomElK1DnM"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Axe-08",
    description:     "Legendary axe — particle-effect blade with ember and smoke trails on swing. OBJ + FBX, 4K PBR. Premium detail for final boss and legendary loot drops.",
    price:           1599,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1tqcYpL3wqMpomBiXOo_N6yDwspdEgmWu"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1tqcYpL3wqMpomBiXOo_N6yDwspdEgmWu"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },

  // ══════════════════════════════════════════════════════════════════════
  //  WEAPONS — HAMMER / SWORD
  // ══════════════════════════════════════════════════════════════════════

  {
    name:            "Hammer-01",
    description:     "War hammer with flanged iron head and worn oak haft. OBJ + FBX, 4K PBR. Solid choice for paladin, blacksmith, and siege roles.",
    price:           999,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1rOZz4JdPpbII8L68TkmPxCNrKhC0Bnax"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1rOZz4JdPpbII8L68TkmPxCNrKhC0Bnax"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Hammer-02",
    description:     "Thunder hammer — electrified head with crackling lightning effect on impact. OBJ + FBX, 4K PBR. Premium detail for divine and storm-class builds.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1vzptVR7H_6LP5mt_n_8d9I1SBXggylAF"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1vzptVR7H_6LP5mt_n_8d9I1SBXggylAF"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },
  {
    name:            "Sword-03",
    description:     "Broad sword with double-edged blade and ornate crossguard. OBJ + FBX, 4K PBR. Clean slash geometry ideal for combo attack and parry animations.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("15BTm6HFoc8WUHpAbIucC1LBHY7M_bs5r"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("15BTm6HFoc8WUHpAbIucC1LBHY7M_bs5r"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null,
    fileKeyFbx:      null,
    fileKeyGlb:      null,
    animIdleUrl:     null,
    animWalkUrl:     null,
    animRunUrl:      null,
    animAttackOneUrl: null,
    animAttackTwoUrl: null,
    animDeathUrl:    null,
    animHitUrl:      null,
  },

  // ══════════════════════════════════════════════════════════════════════
  //  ARCHITECTURE — EXTERIOR
  // ══════════════════════════════════════════════════════════════════════

  { name: "Exterior Design 01", description: "AI-generated exterior architectural visualization. Cinematic lighting, photorealistic materials.", price: 499, category: "exterior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1kp23x5YBnWovDamPDT2FS00d1ID9SB0k"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Exterior Design 02", description: "AI-generated exterior architectural visualization. Cinematic lighting, photorealistic materials.", price: 499, category: "exterior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("10CfcifgZBQMoxK2L_ANH8TJ8vUj7v26T"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Exterior Design 03", description: "AI-generated exterior architectural visualization. Cinematic lighting, photorealistic materials.", price: 499, category: "exterior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1uK7a0BedMTfGWeZ17WxJt-YYKAJL3bZJ"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Exterior Design 04", description: "AI-generated exterior architectural visualization. Cinematic lighting, photorealistic materials.", price: 499, category: "exterior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1On-oICTEgx81tNSRyW7DZYk3IOEDBiAT"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Exterior Design 05", description: "AI-generated architectural cinematic exterior. Dramatic angles, photorealistic render.", price: 499, category: "exterior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1MJR8A38OCNRDxb_jRheBdRgexnAOugZf"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },

  // ══════════════════════════════════════════════════════════════════════
  //  ARCHITECTURE — INTERIOR
  // ══════════════════════════════════════════════════════════════════════

  { name: "Interior Design 01", description: "AI-generated cinematic interior visualization. Moody ambient lighting, photorealistic surfaces.", price: 499, category: "interior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("16IlbksfqFgAsIUlIbSnfG1k0miktYC0d"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Interior Design 02", description: "AI-generated cinematic interior visualization. Moody ambient lighting, photorealistic surfaces.", price: 499, category: "interior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1cHTTgKBilMBXIrIGuSqB2tAb4A9WdobJ"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Interior Design 03", description: "AI-generated cinematic interior visualization. Moody ambient lighting, photorealistic surfaces.", price: 499, category: "interior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1A9sgWrWpi_Jq2NWZIH5mkh2XP491_2Ce"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Interior Design 04", description: "AI-generated cinematic interior visualization. Moody ambient lighting, photorealistic surfaces.", price: 499, category: "interior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1sr1O1HBL-q0oFZ2mfhgI3Zf3Y_AWmOzl"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Interior Design 05", description: "AI-generated cinematic interior visualization. Moody ambient lighting, photorealistic surfaces.", price: 499, category: "interior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1wQtULgqst4SX2imqwdEhnqYRgzcPWJiu"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Interior Design 06", description: "AI-generated cinematic interior visualization. Moody ambient lighting, photorealistic surfaces.", price: 499, category: "interior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1iqOFR1-0gO4v-Wk7PzBKZ2TsSeL0qoOW"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },
  { name: "Interior Design 07", description: "AI-generated cinematic interior visualization. Moody ambient lighting, photorealistic surfaces.", price: 499, category: "interior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1p34uCYAykKSH9c5fHXh1PuRn_S5XS3sG"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },

  // ══════════════════════════════════════════════════════════════════════
  //  TIMELAPSE
  // ══════════════════════════════════════════════════════════════════════

  { name: "House Build Timelapse 01", description: "Full AI-generated house construction timelapse — exterior to interior reveal. Cinematic camera work, photorealistic render throughout.", price: 799, category: "interior" as const, packageTier: "mesh_only" as const, isLatest: false, isActive: true, previewVideoUrl: gd("1-V_JEJtAQvcl6FuldAxpFUFCUV9qwo5Q"), facePngUrl: null, threeDUrl: null, actionOneUrl: null, actionTwoUrl: null, actionThreeUrl: null, fileKeyObj: null, fileKeyFbx: null, fileKeyGlb: null, animIdleUrl: null, animWalkUrl: null, animRunUrl: null, animAttackOneUrl: null, animAttackTwoUrl: null, animDeathUrl: null, animHitUrl: null },

  // ══════════════════════════════════════════════════════════════════════
  //  CHARACTERS — CYBORG SERIES (Mid tier — new drop May 2026)
  //  Pricing: Mesh ₱899 | Standard ₱1,899 | Full ₱3,199
  // ══════════════════════════════════════════════════════════════════════

  {
    name:            "Cyborg-01",
    description:     "AI-generated cyborg character with sleek chrome plating and blue LED accents. OBJ + FBX, 4K PBR textures. High-detail surface for close-up renders and game cinematics.",
    price:           3199,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1_0nDq8ZV_p77DunIBBUqNShtd7sPUaM3"),
    facePngUrl:      gimg("1z_tv87eXQ3VpPBDts-pemYTYc0IVp2CW"),
    threeDUrl:       null,
    actionOneUrl:    gd("1_0nDq8ZV_p77DunIBBUqNShtd7sPUaM3"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null, fileKeyFbx: null, fileKeyGlb: null,
    animIdleUrl:     null, animWalkUrl: null, animRunUrl: null,
    animAttackOneUrl: null, animAttackTwoUrl: null,
    animDeathUrl:    null, animHitUrl: null,
  },
  {
    name:            "Cyborg-02",
    description:     "Tactical cyborg unit — reinforced shoulder armor, dual sensor eyes, matte-black finish. OBJ + FBX, 4K PBR textures. Built for military and sci-fi game environments.",
    price:           3199,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1XoKJxcm-L7UXQXvXFkF18Gfrn032i1Qt"),
    facePngUrl:      gimg("1EdznDR_XhYWhEdoHrvm9Pj6inU3kXLj_"),
    threeDUrl:       null,
    actionOneUrl:    gd("1XoKJxcm-L7UXQXvXFkF18Gfrn032i1Qt"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null, fileKeyFbx: null, fileKeyGlb: null,
    animIdleUrl:     null, animWalkUrl: null, animRunUrl: null,
    animAttackOneUrl: null, animAttackTwoUrl: null,
    animDeathUrl:    null, animHitUrl: null,
  },
  {
    name:            "Cyborg-03",
    description:     "Stealth cyborg with angular frame, cloaking panel detail, and red visor. OBJ + FBX, 4K PBR textures. Optimized for infiltration and assassin-class game builds.",
    price:           3199,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1MeLcVZHKHlmgxqa_bNZnkGFymEkyj3mo"),
    facePngUrl:      gimg("172xNVeWgDKRBgKjYwqDvP1ZcHR-I6qr9"),
    threeDUrl:       null,
    actionOneUrl:    gd("1MeLcVZHKHlmgxqa_bNZnkGFymEkyj3mo"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null, fileKeyFbx: null, fileKeyGlb: null,
    animIdleUrl:     null, animWalkUrl: null, animRunUrl: null,
    animAttackOneUrl: null, animAttackTwoUrl: null,
    animDeathUrl:    null, animHitUrl: null,
  },
  {
    name:            "Cyborg-04",
    description:     "Heavy combat cyborg — oversized arms, gatling mount on right shoulder, battle-worn plating. OBJ + FBX, 4K PBR textures. Designed for tank and siege roles in sci-fi games.",
    price:           3199,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1u5a6AfT-k9iL1s4IsGGj1W_lsAULBQTv"),
    facePngUrl:      gimg("1mG-1wnFRDtfG0kD7C9ycGYW6KzToWO7J"),
    threeDUrl:       null,
    actionOneUrl:    gd("1u5a6AfT-k9iL1s4IsGGj1W_lsAULBQTv"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null, fileKeyFbx: null, fileKeyGlb: null,
    animIdleUrl:     null, animWalkUrl: null, animRunUrl: null,
    animAttackOneUrl: null, animAttackTwoUrl: null,
    animDeathUrl:    null, animHitUrl: null,
  },
  {
    name:            "Cyborg-05",
    description:     "Medic cyborg — sleek white-and-gold design with biotech scanner arm and holographic HUD. OBJ + FBX, 4K PBR textures. Support class character for sci-fi RPG and strategy games.",
    price:           3199,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1Heyn0W6pJdiCHMsEzxGyW05afKmQ1dql"),
    facePngUrl:      gimg("1Sifbx4X931_lee8vd4uVg8x0LzXmL7Gm"),
    threeDUrl:       null,
    actionOneUrl:    gd("1Heyn0W6pJdiCHMsEzxGyW05afKmQ1dql"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null, fileKeyFbx: null, fileKeyGlb: null,
    animIdleUrl:     null, animWalkUrl: null, animRunUrl: null,
    animAttackOneUrl: null, animAttackTwoUrl: null,
    animDeathUrl:    null, animHitUrl: null,
  },
  {
    name:            "Cyborg-06",
    description:     "Rogue cyborg — asymmetric design, exposed wiring, cracked faceplate with glowing core. OBJ + FBX, 4K PBR textures. Villain and antagonist archetype for dark sci-fi narratives.",
    price:           3199,



    category:        "character" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1bJgokl67ZfUQmn8JGoS5mU1EzjZ-MSbk"),
    facePngUrl:      gimg("1bthqtLgJXwuJ7ADX14m1ZSdN850Sfnmy"),
    threeDUrl:       null,
    actionOneUrl:    gd("1bJgokl67ZfUQmn8JGoS5mU1EzjZ-MSbk"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null, fileKeyFbx: null, fileKeyGlb: null,
    animIdleUrl:     null, animWalkUrl: null, animRunUrl: null,
    animAttackOneUrl: null, animAttackTwoUrl: null,
    animDeathUrl:    null, animHitUrl: null,
  },

  // ══════════════════════════════════════════════════════════════════════
  //  WEAPONS — SWORD SERIES (new: sw-01, sw-02, sw-04)
  //  Pricing: Mesh ₱599 | Standard ₱1,199 | Full Pack N/A
  // ══════════════════════════════════════════════════════════════════════

  {
    name:            "Sword-01",
    description:     "Elegant longsword with tapered double-edge blade and ornate crossguard. OBJ + FBX, 4K PBR textures. Classic knight-class weapon for fantasy RPG and action games.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1Y1Ww0jOlGAPUA9Y7I7BAjLh1ymezppww"),
    facePngUrl:      gimg("1kvKu22j4gtmFu_fTmHcCrsUFCAka0EVx"),
    threeDUrl:       null,
    actionOneUrl:    gd("1Y1Ww0jOlGAPUA9Y7I7BAjLh1ymezppww"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null, fileKeyFbx: null, fileKeyGlb: null,
    animIdleUrl:     null, animWalkUrl: null, animRunUrl: null,
    animAttackOneUrl: null, animAttackTwoUrl: null,
    animDeathUrl:    null, animHitUrl: null,
  },
  {
    name:            "Sword-02",
    description:     "Short sword with wide fuller and reinforced tip — designed for fast close-range combat. OBJ + FBX, 4K PBR textures. Great for rogue and duelist character builds.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1ejAoS0nlpyGCBw-t7pvJ3bQ1GAXBXuIm"),
    facePngUrl:      null,
    threeDUrl:       null,
    actionOneUrl:    gd("1ejAoS0nlpyGCBw-t7pvJ3bQ1GAXBXuIm"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null, fileKeyFbx: null, fileKeyGlb: null,
    animIdleUrl:     null, animWalkUrl: null, animRunUrl: null,
    animAttackOneUrl: null, animAttackTwoUrl: null,
    animDeathUrl:    null, animHitUrl: null,
  },
  {
    name:            "Sword-04",
    description:     "Curved scimitar with engraved blade and jeweled pommel. OBJ + FBX, 4K PBR textures. High visual impact for desert warrior and merchant prince character archetypes.",
    price:           1199,



    category:        "weapon" as const,
    packageTier:     "full_pack" as const,
    isLatest:        false,
    isActive:        true,
    previewVideoUrl: gd("1TM7JZY55zR5JNHW3TxFzcOLX6r3AXDgz"),
    facePngUrl:      gimg("1NGRpRs03SvU6Xw6AUzqExUpdxYU2ZY4i"),
    threeDUrl:       null,
    actionOneUrl:    gd("1TM7JZY55zR5JNHW3TxFzcOLX6r3AXDgz"),
    actionTwoUrl:    null,
    actionThreeUrl:  null,
    fileKeyObj:      null, fileKeyFbx: null, fileKeyGlb: null,
    animIdleUrl:     null, animWalkUrl: null, animRunUrl: null,
    animAttackOneUrl: null, animAttackTwoUrl: null,
    animDeathUrl:    null, animHitUrl: null,
  },
];

async function main() {
  console.log(`Seeding ${products.length} products...`);
  for (const p of products) {
    const seedId = `seed-${p.name.toLowerCase().replace(/\s+/g, "-")}`;
    await prisma.product.upsert({
      where:  { id: seedId },
      update: p,
      create: { id: seedId, ...p },
    });
    console.log(`✓ ${p.name}  ₱${p.price}  [${p.packageTier}]${p.isLatest ? "  ★ Latest" : ""}`);
  }
  console.log("\nDone. All products seeded.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());