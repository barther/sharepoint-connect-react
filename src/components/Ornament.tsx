export const Ornament = ({ className = "" }: { className?: string }) => (
  <div className={`ornament text-lg select-none ${className}`} aria-hidden>
    ❦ &nbsp; · &nbsp; ❦
  </div>
);
