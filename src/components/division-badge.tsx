const LABEL: Record<string, string> = {
  div1: "DIV 1",
  div2: "DIV 2",
  div3: "DIV 3",
  div4: "DIV 4",
  div5: "DIV 5",
  div6: "DIV 6",
  rookie: "ROOKIE",
};

export function DivisionBadge({ division }: { division: string }) {
  return <span className={`division division-${division}`}>{LABEL[division] ?? division}</span>;
}
