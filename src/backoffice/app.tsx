// Ported provider stack from src/backoffice/src/pages/_app.tsx.
// Step 1 deliberately keeps this self-contained — no imports from the backoffice
// context/ tree yet, because those drag in Navbar/SideMenu/BrandSelector and the
// full UI kit. We re-create the same context shapes here so child screens can
// consume them; Step 2 will swap each provider for the original implementation
// as we port the screens that need them.
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import defaultTranslations from "./src/utils/services/translations/default.json";

// ---------- Global context ----------
type AppSize = "xsm" | "sm" | "md" | "lg" | "xl" | "xxl";
interface GlobalState {
  appSize: AppSize;
  locale: string;
  sideMenuCollapsed: boolean;
  sideMenuCollapseRequest: number;
}
interface GlobalContextI {
  state: GlobalState;
  setState: React.Dispatch<React.SetStateAction<GlobalState>>;
  sideMenuListener: any;
  setSideMenuListener: (v: any) => void;
}
const GlobalContext = React.createContext<GlobalContextI>({
  state: { appSize: "lg", locale: "EN", sideMenuCollapsed: false, sideMenuCollapseRequest: 0 },
  setState: () => {},
  sideMenuListener: null,
  setSideMenuListener: () => {},
});
export { GlobalContext };

// ---------- Auth context ----------
interface AuthContextI {
  isAuthenticated: boolean;
  token?: string;
  saveNewToken: (t: string) => void;
  logout: () => void;
}
const AuthContext = React.createContext<AuthContextI>({
  isAuthenticated: false,
  saveNewToken: () => {},
  logout: () => {},
});
export { AuthContext };

// ---------- Brand context (stub for Step 1) ----------
interface BrandContextI {
  brandId?: number;
  currentBrand?: { id?: number; name?: string };
  setCurrentBrand: (b: any) => void;
  refreshBrand: () => void;
}
const BrandContext = React.createContext<BrandContextI>({
  setCurrentBrand: () => {},
  refreshBrand: () => {},
});
export { BrandContext };

// ---------- Dialog context ----------
interface DialogDescriptor {
  dialogId: string;
  content: React.ReactNode;
  dialogProps?: { displayClose?: boolean; onClose?: () => void };
  onCloseCallback?: () => void;
}
interface DialogContextI {
  displayDialog: (d: DialogDescriptor) => void;
  removeDialog: (id: string) => void;
  removeAllDialogs: () => void;
  dialogConfirm: (props: any) => void;
}
const DialogContext = React.createContext<DialogContextI>({
  displayDialog: () => {},
  removeDialog: () => {},
  removeAllDialogs: () => {},
  dialogConfirm: () => {},
});
export { DialogContext };

// ---------- Globals mirrored from _app.tsx for textTranslated() ----------
export const queryClient = new QueryClient();
export const globalData: {
  translations: any[];
  editTranslations: boolean;
  locale: string;
  brandId: number | undefined;
} = {
  translations: [],
  editTranslations: false,
  locale: "en-GB",
  brandId: 0,
};

// ---------- Wrapper ----------
export function BackofficeApp({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<GlobalState>({
    appSize: "lg",
    locale: "EN",
    sideMenuCollapsed: false,
    sideMenuCollapseRequest: 0,
  });
  const [sideMenuListener, setSideMenuListener] = React.useState<any>(null);

  const [isAuthenticated, setAuth] = React.useState(false);
  const [token, setToken] = React.useState<string | undefined>(undefined);
  const auth = React.useMemo<AuthContextI>(
    () => ({
      isAuthenticated,
      token,
      saveNewToken: (t: string) => {
        setToken(t);
        setAuth(true);
      },
      logout: () => {
        setToken(undefined);
        setAuth(false);
      },
    }),
    [isAuthenticated, token]
  );

  const [currentBrand, setCurrentBrand] = React.useState<any>({ id: 1, name: "Default Brand" });
  const brand = React.useMemo<BrandContextI>(
    () => ({
      currentBrand,
      brandId: currentBrand?.id,
      setCurrentBrand,
      refreshBrand: () => {},
    }),
    [currentBrand]
  );

  const [dialogs, setDialogs] = React.useState<DialogDescriptor[]>([]);
  const dialogApi = React.useMemo<DialogContextI>(
    () => ({
      displayDialog: (d) => setDialogs((cur) => [...cur.filter((x) => x.dialogId !== d.dialogId), d]),
      removeDialog: (id) =>
        setDialogs((cur) => {
          const found = cur.find((x) => x.dialogId === id);
          found?.onCloseCallback?.();
          found?.dialogProps?.onClose?.();
          return cur.filter((x) => x.dialogId !== id);
        }),
      removeAllDialogs: () => setDialogs([]),
      dialogConfirm: () => {},
    }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalContext.Provider value={{ state, setState, sideMenuListener, setSideMenuListener }}>
        <AuthContext.Provider value={auth}>
          <BrandContext.Provider value={brand}>
            <DialogContext.Provider value={dialogApi}>
              <ToastContainer theme="colored" />
              {children}
              {dialogs.map((d) => (
                <div key={d.dialogId}>{d.content}</div>
              ))}
            </DialogContext.Provider>
          </BrandContext.Provider>
        </AuthContext.Provider>
      </GlobalContext.Provider>
    </QueryClientProvider>
  );
}
