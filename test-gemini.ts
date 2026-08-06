import { config } from "dotenv";
config({ path: ".env.local" });

import { generateSynopsisAndOutline, generateChapterWriting } from "./src/lib/gemini-engine";

async function main() {
  console.log("⏳ Menguji Gemini 3.5 Flash (Ideasi -> Sinopsis)...");
  const ideation = await generateSynopsisAndOutline("Seorang barista menemukan portal ke dimensi lain di dalam mesin espressonya.");
  console.log(ideation.text || ideation.error);
  
  console.log("\n=======================================================\n");
  
  console.log("⏳ Menguji Gemini 3.1 Pro (Menulis Bab 1)...");
  const chapter = await generateChapterWriting("Kopi Antar Dimensi", 1, "Toko kopi sepi di malam hujan. Tokoh utama (Raka) membersihkan mesin espresso dan melihat secercah cahaya aneh dari dalam filter kopi.");
  console.log(chapter.text || chapter.error);
}

main().catch(console.error);
