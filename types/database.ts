// De basisstructuur van een editie
export type Edition = {
    id: number;
    title: string;
    publication_year: number;
    description: string;
    # Voeg hier meer velden toe (zoals price, stock, etc.)
  };
  
  // De basisstructuur van een foto
  export type Photo = {
      id: number;
      storage_path: string;
      sort_order: number;
      caption: string | null;
      edition_id: number | null;
      sub_edition_id: number | null;
  };
  
  // De structuur van een editie inclusief de gekoppelde foto's
  export type EditionWithPhotos = Edition & {
      photos: Photo[];
  };