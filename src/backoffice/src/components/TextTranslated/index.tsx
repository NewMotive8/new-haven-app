// Minimal port of the original TextTranslated. The original component included
// an in-place translation editor (editorTranslation/*) that pulled in TinyMCE,
// the full UI kit, and the Next.js _app module. Step 2 only needs the lookup
// behaviour; the editor can be ported in a later step if/when the team needs it.
import * as React from "react";
import { globalData } from "../../../app";

interface Replaces {
  code: string;
  value: any;
}

interface Props {
  group: string;
  key: string;
  replaces?: Array<Replaces>;
  defaultContent?: any;
  returnDefault?: "translateKey" | "nothing" | "defaultContent";
}

function applyReplaces(text: any, replaces?: Array<Replaces>) {
  if (!replaces?.length || typeof text !== "string") return text;
  return replaces.reduce((acc, r) => acc.replace(r.code, String(r.value)), text);
}

function lookup(group: string, key: string, locale: string) {
  const { translations } = globalData;
  if (!Array.isArray(translations) || translations.length === 0) return null;
  const g = group?.toLowerCase();
  const k = key?.toLowerCase();
  const l = locale?.toLowerCase();
  return (
    translations.find(
      (t: any) =>
        t.group?.toLowerCase() === g && t.key?.toLowerCase() === k && t.locale?.toLowerCase() === l
    ) ||
    translations.find(
      (t: any) =>
        t.group?.toLowerCase() === g && t.key?.toLowerCase() === k && t.locale?.toLowerCase() === "en-gb"
    ) ||
    null
  );
}

export function textTranslated(props: Props): React.ReactNode {
  const { group, key, replaces, returnDefault, defaultContent } = props;
  const found: any = lookup(group, key, globalData.locale);
  if (found) {
    if (found.isHTML || found.isHtml) {
      return (
        <span
          dangerouslySetInnerHTML={{ __html: String(applyReplaces(found.value ?? key, replaces)) }}
        />
      );
    }
    return applyReplaces(found.value ?? key, replaces);
  }
  if (returnDefault === "nothing") return "";
  if (returnDefault === "defaultContent" && defaultContent !== undefined) return defaultContent;
  return key;
}

export default function TextTranslated(props: Props) {
  return <>{textTranslated(props)}</>;
}
