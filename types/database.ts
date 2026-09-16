// Database types voor de Beautiful Editions website

export type Publisher = {
  id: number;
  name: string;
};

export type Series = {
  id: number;
  name: string;
  publisher_id: number;
  publisher?: Publisher;
};

export type Author = {
  id: number;
  name: string;
  wiki_link: string | null;
};

export type Work = {
  id: number;
  original_title: string;
  english_title: string | null;
  original_publication_year: string | null;
  original_language: string | null;
  wiki_link: string | null;
  notes: string | null;
  sort_title: string | null;
};

export type Edition = {
  id: number;
  publisher_id: number;
  series_id: number | null;
  title: string;
  isbn: string | null;
  publication_year: number | null;
  language: string | null;
  slipcase: boolean;
  dustjacket: boolean;
  clamshell: boolean;
  is_limited_edition: boolean;
  limited_edition_count: number | null;
  publisher_url: string | null;
  sequence_number: number | null;
  catalogue_number: string | null;
  size_dimensions: string | null;
  pages_description: string | null;
  binding_type: string | null;
  typeface: string | null;
  printer: string | null;
  binder: string | null;
  details: string | null;
  notes: string | null;
  // Relations
  work?: Work;
  publisher?: Publisher;
  series?: Series;
  sub_editions?: Edition[];
};

export type Photo = {
  id: number;
  storage_path: string;
  sort_order: number;
  caption: string | null;
  edition_id: number | null;
  sub_edition_id: number | null;
};

export type EditionContributorLink = {
  role: string | null;
  contributor?: {
    id: number;
    name: string;
    wiki_link: string | null;
  } | null;
};

export type EditionWithRelations = Edition & {
  work?: Work & {
    work_authors?: {
      author: Author;
    }[];
  };
  publisher?: Publisher;
  series?: Series | null;
  photos?: Photo[];
  sub_editions?: Edition[];
  contributors?: EditionContributorLink[];
};
