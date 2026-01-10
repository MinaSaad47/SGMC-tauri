export const routeConfig = {
  "/patients/new": { back: "/patients" },
  "/patients/:id": { back: "/patients" },
  "/patients/:id/statements/new": { back: -1 }, // Dynamic back
  "/statements/new": { back: "/statements" },
  "/statements/:id": { back: -1 }, // Usually back to patient details or list
};

export const getBackRoute = (pathname: string): string | number | null => {
  // Direct match
  if (pathname in routeConfig) {
    return (routeConfig as any)[pathname].back;
  }

  // Pattern matching for IDs
  if (pathname.match(/^\/patients\/[^/]+$/)) {
    return "/patients";
  }
  if (pathname.match(/^\/statements\/[^/]+$/)) {
    return -1; // Go back to previous page
  }
  if (pathname.match(/^\/patients\/[^/]+\/statements\/new$/)) {
    return -1;
  }

  return null;
};
