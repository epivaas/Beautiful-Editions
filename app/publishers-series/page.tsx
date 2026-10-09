import { permanentRedirect } from "next/navigation";

// Publishers and Series are separate pages now; keep old links working.
export default function PublishersSeriesPage() {
  permanentRedirect("/publishers");
}
