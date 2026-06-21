import { Link } from "react-router-dom";
import FaixaConfianca from "./FaixaConfianca";
import TagEstimativa from "./TagEstimativa";
import type { RankingLine } from "../lib/types";

interface CardRankingLinhaProps {
  line: RankingLine;
}

export default function CardRankingLinha({ line }: CardRankingLinhaProps) {
  return (
    <Link
      to={`/linha/${line.id}`}
      className="block rounded-xl border border-tint bg-paper p-4 shadow-sm transition hover:border-teal/30 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            #{line.rank}
          </span>
          <h2 className="text-lg font-semibold text-darktxt">{line.name}</h2>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{line.mode_label}</span>
            {line.mode === "metro" && <TagEstimativa />}
          </p>
        </div>
        <FaixaConfianca reliability={line.reliability} compact />
      </div>
    </Link>
  );
}
