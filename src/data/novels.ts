import type { Novel } from "@/types/novel";

export const novels: Novel[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "rumah-yang-mengingat-nama",
    title: "Rumah yang Mengingat Nama",
    author: "Nara Pradipta",
    genres: ["Magis", "Keluarga"],
    status: "Berjalan",
    synopsis:
      "Ketika Sora pulang ke kota kecilnya, rumah masa kecilnya mulai memanggil nama-nama yang seharusnya telah dilupakan.",
    cover: "/covers/rumah-yang-mengingat-nama.svg",
    featured: true,
    chapters: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        number: 1,
        slug: "pintu-yang-terbuka",
        title: "Pintu yang Terbuka",
        excerpt: "Sora tiba ketika hujan baru saja berhenti.",
        paragraphs: [
          "Sora tiba ketika hujan baru saja berhenti. Jalanan di depan rumah itu masih mengilap, memantulkan pohon mangga dan langit yang terlalu pucat untuk disebut sore.",
          "Kunci tua itu berputar pelan. Dari balik pintu, aroma kayu basah menyambutnya seperti seseorang yang sudah lama berlatih menunggu.",
          "Di dinding ruang tamu tergantung foto keluarga. Sora mengenali semua wajah, kecuali satu bayangan kecil di pojok bingkai. Bayangan itu memegang selembar kertas bertuliskan namanya.",
        ],
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        number: 2,
        slug: "suara-di-loteng",
        title: "Suara di Loteng",
        excerpt: "Malam pertama selalu membuat rumah terasa lebih besar.",
        paragraphs: [
          "Malam pertama selalu membuat rumah terasa lebih besar. Bunyi pipa, daun yang bergesekan, dan kayu yang memuai menjelma percakapan rahasia.",
          "Tepat pukul dua belas, suara langkah datang dari loteng. Bukan langkah terburu-buru, melainkan langkah seseorang yang sedang mencari jalan pulang.",
          "Sora membawa senter ke atas. Di antara kardus-kardus, ia menemukan buku alamat ibunya—terbuka pada halaman kosong, kecuali sebuah nama yang muncul perlahan dengan tinta biru.",
        ],
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "peta-dari-musim-kemarau",
    title: "Peta dari Musim Kemarau",
    author: "Raka Aditama",
    genres: ["Petualangan", "Persahabatan"],
    status: "Tamat",
    synopsis:
      "Sebuah peta buatan tangan membawa dua sahabat menyusuri sungai yang mengering dan cerita-cerita lama yang tertinggal di dasarnya.",
    cover: "/covers/peta-dari-musim-kemarau.svg",
    featured: true,
    chapters: [
      {
        id: "20000000-0000-4000-8000-000000000001",
        number: 1,
        slug: "garis-biru-di-kertas-cokelat",
        title: "Garis Biru di Kertas Cokelat",
        excerpt: "Peta itu ditemukan di dalam kaleng biskuit berkarat.",
        paragraphs: [
          "Peta itu ditemukan di dalam kaleng biskuit berkarat, terselip di bawah benang layang-layang dan kelereng yang tak lagi bening.",
          "Damar menunjuk garis biru yang terputus-putus. Ia yakin itu sungai. Lila yakin itu jalan. Keduanya sepakat hanya pada satu hal: peta itu ingin dibaca di luar rumah.",
          "Mereka berangkat sebelum matahari tinggi, membawa botol air, roti tawar, dan keberanian yang ukurannya belum mereka ukur.",
        ],
      },
      {
        id: "20000000-0000-4000-8000-000000000002",
        number: 2,
        slug: "dasar-sungai",
        title: "Dasar Sungai",
        excerpt: "Di dasar sungai yang kering, batu-batu menyimpan jejak air.",
        paragraphs: [
          "Di dasar sungai yang kering, batu-batu menyimpan jejak air seperti garis-garis halus di telapak tangan seorang kakek.",
          "Lila menemukan sendok perak kecil. Damar menemukan tulisan pada batu datar: pulanglah sebelum burung pertama terbang.",
          "Mereka tidak mengerti maksudnya, tetapi menjelang petang, keduanya mulai mendengar kepak sayap dari arah yang tak ada di peta.",
        ],
      },
      {
        id: "20000000-0000-4000-8000-000000000003",
        number: 3,
        slug: "tempat-air-bersembunyi",
        title: "Tempat Air Bersembunyi",
        excerpt: "Peta berakhir di bawah pohon asam paling tua.",
        paragraphs: [
          "Peta berakhir di bawah pohon asam paling tua di kampung. Tidak ada harta karun, tidak ada peti, hanya tanah yang sedikit lebih gelap daripada sekitarnya.",
          "Saat mereka menggali dengan tangan, air dingin merembes di antara jari-jari. Sungai itu tidak hilang, pikir Lila. Ia hanya memilih tempat untuk beristirahat.",
          "Mereka pulang saat burung pertama melintas. Di saku Damar, peta kertas cokelat telah berubah menjadi putih bersih—siap digambar lagi kapan saja.",
        ],
      },
    ],
  },
];

export const allGenres = Array.from(new Set(novels.flatMap((novel) => novel.genres)));

export function findNovel(slug: string) {
  return novels.find((novel) => novel.slug === slug);
}

export function findChapter(novelSlug: string, chapterSlug: string) {
  const novel = findNovel(novelSlug);
  return { novel, chapter: novel?.chapters.find((chapter) => chapter.slug === chapterSlug) };
}
