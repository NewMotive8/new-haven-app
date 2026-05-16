// next/app type shim — backoffice files only import the AppProps type from here.
import type { ComponentType } from "react";

export interface AppProps<P = Record<string, unknown>> {
  Component: ComponentType<P>;
  pageProps: P & Record<string, any>;
  router: {
    route: string;
    pathname: string;
    asPath: string;
    query: Record<string, any>;
  };
}
export default {} as never;
