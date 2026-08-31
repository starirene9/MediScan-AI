import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { NavProvider } from "./context/NavContext";
import { useEffect, useState } from "react";
import { messages } from "./locales/messages";

import Header from "./components/ui/Header";
import Nav from "./components/ui/Nav";
import Footer from "./components/ui/Footer";
import Main from "./components/ui/Main";
import Login from "./pages/login/Login";
import useLocalStorage from "./hooks/useLocalStorage";
import { IntlProvider } from "react-intl";
import { ColorModeProvider } from "./context/ColorModeContext";

export interface AuthProps {
  isAuthenticatedLS?: boolean;
  setIsAuthenticatedLS: (auth: boolean) => void;
  setLocale: (locale: string) => void;
}

interface AppShellProps {
  isAuthenticatedLS: boolean;
  setIsAuthenticatedLS: (auth: boolean) => void;
  setLocale: (locale: string) => void;
}

function AppShell({
  isAuthenticatedLS,
  setIsAuthenticatedLS,
  setLocale,
}: AppShellProps) {
  const { pathname } = useLocation();
  const showChrome = isAuthenticatedLS && pathname !== "/login";

  return (
    <div className="flex flex-col min-h-screen">
      {showChrome && (
        <Header
          setIsAuthenticatedLS={setIsAuthenticatedLS}
          setLocale={setLocale}
        />
      )}
      <div className="flex flex-1">
        {showChrome && <Nav />}
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticatedLS ? (
                <Navigate to="/" replace />
              ) : (
                <Login
                  setIsAuthenticatedLS={setIsAuthenticatedLS}
                  setLocale={setLocale}
                />
              )
            }
          />
          <Route
            path="/*"
            element={
              isAuthenticatedLS ? <Main /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </div>
      {showChrome && <Footer />}
    </div>
  );
}

function App() {
  const [isAuthenticatedLS, setIsAuthenticatedLS] = useLocalStorage(
    "isLoggedIn",
    false
  );
  const [locale, setLocale] = useState<keyof typeof messages>(
    (localStorage.getItem("locale") as keyof typeof messages) || "en"
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("locale");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("locale", locale);
  }, [locale]);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticatedLS(!!localStorage.getItem("isLoggedIn"));
    };

    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [setIsAuthenticatedLS]);

  return (
    <Provider store={store}>
      <IntlProvider
        locale={locale}
        messages={messages[locale] || messages["en"]}
      >
        <ColorModeProvider>
          <NavProvider>
            <Router>
              <AppShell
                isAuthenticatedLS={isAuthenticatedLS}
                setIsAuthenticatedLS={setIsAuthenticatedLS}
                setLocale={setLocale}
              />
            </Router>
          </NavProvider>
        </ColorModeProvider>
      </IntlProvider>
    </Provider>
  );
}

export default App;
