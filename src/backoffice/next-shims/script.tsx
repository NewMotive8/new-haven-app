// next/script shim — injects a <script> tag client-side after mount.
import * as React from "react";

interface ScriptProps {
  id?: string;
  src?: string;
  strategy?: string;
  children?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const Script: React.FC<ScriptProps> = ({ id, src, children, onLoad, onError }) => {
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (id && document.getElementById(id)) return;
    const el = document.createElement("script");
    if (id) el.id = id;
    if (src) el.src = src;
    el.async = true;
    if (onLoad) el.addEventListener("load", onLoad);
    if (onError) el.addEventListener("error", onError);
    if (!src && children) el.textContent = String(children);
    document.body.appendChild(el);
    return () => {
      if (onLoad) el.removeEventListener("load", onLoad);
      if (onError) el.removeEventListener("error", onError);
    };
  }, [id, src, children, onLoad, onError]);
  return null;
};

export default Script;
