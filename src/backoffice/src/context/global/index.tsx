// Unified provider re-export — the original backoffice scattered React contexts
// across src/backoffice/src/context/*. To make every imported screen share the
// SAME context instance as our ported provider stack in src/backoffice/app.tsx,
// each of those files now re-exports from app.tsx.
export { GlobalContext as default, GlobalContext } from "../../../app";
