interface TagEstimativaProps {
  className?: string;
}

export default function TagEstimativa({ className = "" }: TagEstimativaProps) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber bg-amber/15 ${className}`}
    >
      Estimativa
    </span>
  );
}
