import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Reset scroll to the top whenever the route changes — without this, clicking a
// list row carries the previous page's scroll position into the detail view.
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
