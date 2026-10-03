import { STATUS_LABEL } from "@/lib/format";
import type { SubmissionStatus } from "@/lib/types";

export function StatusLabel({ status }: { status: SubmissionStatus }) {
  return <span className={`status status-${status}`}>{STATUS_LABEL[status]}</span>;
}
