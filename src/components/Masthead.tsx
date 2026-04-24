import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { useMsal } from "@azure/msal-react";

export const Masthead = () => {
  const { pathname } = useLocation();
  const { instance, accounts } = useMsal();
  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const account = accounts[0];

  const onSignOut = () => {
    instance.logoutPopup({ postLogoutRedirectUri: window.location.origin }).catch(() => {
      /* user dismissed */
    });
  };

  return (
    <header className="border-b border-foreground/15 bg-background">
      <div className="container-wide pt-5 pb-2 sm:pt-6">
        {/* Title + date */}
        <div className="text-center sm:text-left sm:flex sm:items-baseline sm:justify-between sm:gap-6">
          <Link
            to="/"
            className="font-display text-3xl sm:text-4xl leading-none tracking-tight hover:text-primary transition-colors block"
          >
            The Prayer List
          </Link>
          <p className="font-accent text-sm text-muted-foreground italic mt-2 sm:mt-0">
            {today}
          </p>
        </div>
        <p className="eyebrow text-center sm:text-left mt-2">
          Lithia Springs Methodist
        </p>

        <div className="rule-double mt-4" />

        {/* Nav — large tap targets, stacks evenly on phone */}
        <nav className="grid grid-cols-2 sm:flex sm:items-center sm:gap-2">
          <NavLink to="/" active={pathname === "/"}>Current</NavLink>
          <NavLink to="/archive" active={pathname.startsWith("/archive")}>Past</NavLink>
          <NavLink to="/request/new" active={pathname === "/request/new"}>
            <span className="text-primary font-bold mr-1">＋</span>
            <span>New</span>
          </NavLink>
          {account && (
            <button
              onClick={onSignOut}
              title={account.username}
              className="font-accent text-sm py-3 sm:py-2 px-2 sm:px-4 min-h-[48px] flex items-center justify-center sm:justify-start sm:ml-auto text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="hidden sm:inline italic mr-2">{account.name ?? account.username}</span>
              <span>Sign out</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

const NavLink = ({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) => (
  <Link
    to={to}
    className={`font-accent text-base sm:text-sm py-3 sm:py-2 px-2 sm:px-4 min-h-[48px] flex items-center justify-center sm:justify-start border-b-2 transition-colors ${
      active
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
    }`}
  >
    {children}
  </Link>
);
