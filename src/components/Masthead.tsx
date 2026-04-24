import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";

export const Masthead = () => {
  const { pathname } = useLocation();
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="border-b border-foreground/15 bg-background/60 backdrop-blur-[2px]">
      <div className="container-wide py-6">
        <div className="flex items-baseline justify-between gap-6 flex-wrap">
          <div className="flex items-baseline gap-4">
            <Link to="/" className="font-display text-2xl md:text-3xl leading-none tracking-tight hover:text-primary transition-colors">
              The Prayer List
            </Link>
            <span className="hidden md:inline eyebrow">Lithia Springs Methodist</span>
          </div>
          <p className="font-accent text-xs md:text-sm text-muted-foreground italic">
            {today}
          </p>
        </div>
        <div className="rule-double mt-4" />
        <nav className="mt-3 flex items-center gap-6 font-accent text-sm">
          <NavLink to="/" active={pathname === "/"}>Current</NavLink>
          <NavLink to="/archive" active={pathname.startsWith("/archive")}>Past & Resolved</NavLink>
          <NavLink to="/request/new" active={pathname === "/request/new"}>
            <span className="text-primary">＋</span> New request
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

const NavLink = ({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) => (
  <Link
    to={to}
    className={`relative pb-1 transition-colors ${
      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {children}
    {active && <span className="absolute -bottom-px left-0 right-0 h-px bg-primary" />}
  </Link>
);
