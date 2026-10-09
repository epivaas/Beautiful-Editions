import YellowBand from "./YellowBand";

type ListBandProps = {
  title: string;
  /** One sentence under the title (18 px, 500). */
  sentence: string;
  count: number;
  /** Label under the number: [singular, plural], e.g. ["title", "titles"]. */
  label: [string, string];
  /** Inkt pill above the title, e.g. "Publisher" on a publisher's list of titles. */
  pill?: string | null;
};

/**
 * Compact yellow band that opens every overview list (DESIGN.md §6): the list name, one sentence,
 * and a Gloed block with only the number and its label (no second number, no mono lines).
 */
export default function ListBand({ title, sentence, count, label, pill }: ListBandProps) {
  return (
    <YellowBand
      compact
      size="list"
      title={title}
      publisher={pill}
      count={{ value: count.toLocaleString("en-US"), label: count === 1 ? label[0] : label[1], labelPosition: "below" }}
    >
      <p className="m-0 text-lg font-medium leading-6">{sentence}</p>
    </YellowBand>
  );
}
