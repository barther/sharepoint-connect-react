import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Masthead } from "@/components/Masthead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("Unmatched route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Masthead />
      <div className="container-prose py-24 text-center">
        <p className="eyebrow">Wrong page</p>
        <h1 className="font-display mt-3 text-3xl">This page doesn't exist.</h1>
        <p className="text-muted-foreground mt-4 text-base sm:text-lg">
          The link you followed may have been retired.
        </p>
        <Link to="/" className="btn-primary mt-8 inline-flex">
          Return to the list
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
