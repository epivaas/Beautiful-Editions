export interface Photo {
  id: number;
  storage_path: string;
  sort_order: number;
  copyright_statement?: string;
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

export const getMainPhoto = (photos?: Photo[]) => {
  if (!photos || photos.length === 0) return null;
  // Prefer explicit `is_main` photo when present
  const main = photos.find(p => p.is_main === true);
  if (main) return main;
  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0];
};

export const getAuthorName = (work?: Work) => {
  if (!work) return "Unknown Author";
  const author = work.work_authors?.[0]?.author;
  return author?.name || "Unknown Author";
};

export const getEditionInfo = (edition: Edition, editionsList: Edition[]) => {
  if (edition.series) {
    const seriesName = edition.series.name;
    const publisherId = edition.series.publisher_id;
    const matchingPublisher = editionsList.find(e => e.publisher?.id === publisherId)?.publisher;
    if (matchingPublisher) {
      return `photo from the ${seriesName} (${matchingPublisher.name}) edition`;
    }
    return `photo from the ${seriesName} edition`;
  }
  if (edition.publisher) {
    return `photo from the ${edition.publisher.name} edition`;
  }
  return null;
};
