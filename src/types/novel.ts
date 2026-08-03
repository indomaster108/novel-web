export type Chapter = {
  id: string;
  number: number;
  slug: string;
  title: string;
  excerpt: string;
  paragraphs: string[];
};

export type Novel = {
  id: string;
  slug: string;
  title: string;
  author: string;
  genres: string[];
  status: "Berjalan" | "Tamat" | "Terbit";
  synopsis: string;
  cover: string;
  featured?: boolean;
  chapters: Chapter[];
};
