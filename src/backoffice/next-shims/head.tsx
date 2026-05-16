// next/head shim — no-op for SPA routes. Real <head> is managed by TanStack Router.
import * as React from "react";

const Head: React.FC<{ children?: React.ReactNode }> = () => null;
export default Head;
