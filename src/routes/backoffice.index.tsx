import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
// Import via the backoffice bare-path alias so any nested imports (Typography,
// SCSS module) resolve against src/backoffice/src/*.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — backoffice/** is excluded from the root typecheck on purpose
import BackofficeLanding from "components/backofficeLanding/BackofficeLanding";

export const Route = createFileRoute("/backoffice/")({
  component: BackofficeLanding,
});
