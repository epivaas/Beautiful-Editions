// Texts of the About page, kept apart so they can be edited without touching the page.
// Lines in [brackets] are placeholders for Eric to fill in (DESIGN.md §8).

export const ABOUT_INTRO =
  "Find the edition worth owning. Titles, editions, limited editions, printings and photographs, with their sources.";

/** "What it is": a few short paragraphs in the 760 px column. */
export const WHAT_IT_IS = [
  "Shelfhound is a reference for beautifully illustrated editions: the Folio Society, Curious King, Suntup and other publishers that make books worth keeping. It is for readers and collectors who want to know which edition of a title exists, how they differ and which one to look for.",
  "Every title has its editions, one per publisher and design. An edition can have limited editions, such as a lettered or numbered state with its own print run, and later printings with small differences. Photographs show the books as they are, always with their source.",
];

/** "How to read the data": the four words the site is built on, each with examples. */
export const TERMS: { term: string; text: string; examples: string[]; kind: "plain" | "variant" | "includes" }[] = [
  {
    term: "Edition",
    text: "A publication of a title by one publisher: the same text, the same design and the same binding.",
    examples: ["Folio Society, 1996"],
    kind: "plain",
  },
  {
    term: "Limited edition",
    text: "A clear difference within one edition, such as a lettered or numbered state. It has its own page and its own print run.",
    examples: ["Lettered · 26", "Numbered · 250"],
    kind: "variant",
  },
  {
    term: "Printing",
    text: "A new printing of the same edition, with small differences. Printings are listed in a table on the edition page.",
    examples: ["First printing", "Second printing"],
    kind: "plain",
  },
  {
    term: "Includes",
    text: "What comes with the book: slipcase, dust jacket, clamshell box and more. All equally important.",
    examples: ["Slipcase", "Dust jacket"],
    kind: "includes",
  },
];

/** The FAQ; the first question is open. */
export const FAQ: { question: string; answer: string }[] = [
  {
    question: "What counts as an edition?",
    answer:
      "An edition is a publication of a title by one publisher, with its own year, binding and design. Publications with a clear difference in execution, such as a lettered or numbered state, are limited editions of that edition.",
  },
  {
    question: "What is the difference between a limited edition and a printing?",
    answer:
      "A limited edition is made at the same time as the edition but differs clearly, with its own print run (lettered, numbered, artist). A printing is a later run of the same edition, usually with only small differences. Printings are never limited, so a limited edition never has printings.",
  },
  { question: "Where do the photographs come from?", answer: "[Answer to come]" },
  { question: "Can I use the photographs?", answer: "[Answer to come]" },
  {
    question: "I found a mistake or a missing edition. What do I do?",
    answer:
      "Tell us with the form “Spotted an error?” below. We read everything and publish nothing without checking it first.",
  },
  { question: "Do you sell books?", answer: "[Answer to come]" },
  { question: "How complete is the data?", answer: "[Answer to come]" },
];

export const SPOTTED_AN_ERROR =
  "A missing edition, a wrong date, a photograph that should be removed. Write it down. We read everything and publish nothing without checking it first.";

export const COLOPHON = [
  "Shelfhound is published by Dust BV. Data from the publishers; photographs with their source, rights with their owners. Set in Archivo and IBM Plex Mono.",
  "[Company details, contact, privacy statement]",
];
