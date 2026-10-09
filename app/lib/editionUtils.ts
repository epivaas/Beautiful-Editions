export interface Photo {
  id: number;
  storage_path: string;
  sort_order: number;
  copyright_statement?: string | null;
  is_main?: boolean;
}

export interface Author {
  id: number;
  name: string;
}

export interface Work {
  id: number;
  original_title: string;
  work_authors?: {
    author: Author;
  }[];
}

export interface Publisher {
  id: number;
  name: string;
}

export interface Series {
  id: number;
  name: string;
  publisher_id: number;
}

export interface Edition {
  id: number;
  title: string;
  photos?: Photo[];
  work?: Work;
  publisher?: Publisher;
  series?: Series;
}

/** Public URL of a photo in the Book-photos storage bucket. */
export const getPhotoUrl = (storagePath: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${storagePath}`;

export const getMainPhoto = (photos?: Photo[]) => {
  if (!photos || photos.length === 0) return null;
  // Prefer explicit `is_main` photo when present
  const main = photos.find(p => p.is_main === true);
  if (main) return main;
  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0];
};

