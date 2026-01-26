import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HackerBackground } from "@/components/HackerBackground";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <HackerBackground />
      <div className="text-center relative z-10">
        <h1 className="mb-4 text-4xl font-display font-bold glow-text">404_NOT_FOUND</h1>
        <p className="mb-4 text-xl text-muted-foreground">SYSTEM_ERROR: Page does not exist</p>
        <a href="/" className="text-primary underline hover:text-primary/90 font-mono">
          &gt; RETURN_TO_HUB
        </a>
      </div>
    </div>
  );
};

export default NotFound;
