// Minimal next/dynamic shim using React.lazy.
import * as React from "react";

type Loader<T = any> = () => Promise<{ default: React.ComponentType<T> } | React.ComponentType<T>>;

interface DynamicOptions {
  ssr?: boolean;
  loading?: React.ComponentType<any>;
}

export default function dynamic<T = any>(loader: Loader<T>, options?: DynamicOptions) {
  const Lazy = React.lazy(async () => {
    const mod: any = await loader();
    return { default: (mod && mod.default) ? mod.default : mod };
  });
  const Loading = options?.loading;
  const Wrapped: React.FC<any> = (props) => (
    <React.Suspense fallback={Loading ? <Loading /> : null}>
      <Lazy {...(props as any)} />
    </React.Suspense>
  );
  return Wrapped;
}
