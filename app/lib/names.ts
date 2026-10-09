// Names are stored as "Last, First", so a comma between people would read as part of a name.

/** Separator between people in a list: "Doré, Gustave; Rackham, Arthur". */
export const NAME_SEPARATOR = "; ";

export function joinNames(names: string[]) {
  return names.join(NAME_SEPARATOR);
}
