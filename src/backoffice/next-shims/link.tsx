// next/link shim — falls back to <a>, lets TanStack Router intercept clicks on internal paths.
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string | { pathname: string; query?: Record<string, any> };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  children?: React.ReactNode;
}

function hrefToString(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  const qs = href.query
    ? "?" + new URLSearchParams(href.query as Record<string, string>).toString()
    : "";
  return (href.pathname ?? "/") + qs;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function NextLinkShim(
  { href, children, onClick, replace, ...rest },
  ref
) {
  const navigate = useNavigate();
  const url = hrefToString(href);
  return (
    <a
      ref={ref}
      href={url}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (rest as any).target === "_blank") return;
        e.preventDefault();
        void navigate({ to: url as any, replace });
      }}
      {...rest}
    >
      {children}
    </a>
  );
});

export default Link;
