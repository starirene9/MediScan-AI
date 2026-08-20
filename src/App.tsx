import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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

export interface AuthProps {
  isAuthenticatedLS?: boolean;
  setIsAuthenticatedLS: (auth: boolean) => void;
  setLocale: (locale: string) => void;
}

function App() {
  const [isAuthenticatedLS, setIsAuthenticatedLS] = useLocalStorage(
    "isLoggedIn",
    false
  );
  const [locale, setLocale] = useState<keyof typeof messages>(
    (localStorage.getItem("locale") as keyof typeof messages) || "en"
  );

  // beforeunload : 사용자가 페이지를 닫거나 새로고침할 때 발생하는 브라우저 이벤트
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

    window.addEventListener("storage", checkAuth); // 다른 탭에서도 로그인 상태 유지

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
        <NavProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              {isAuthenticatedLS && (
                <Header
                  setIsAuthenticatedLS={setIsAuthenticatedLS}
                  setLocale={setLocale}
                />
              )}
              <div className="flex flex-1">
                {isAuthenticatedLS && <Nav />}
                <Routes>
                  <Route
                    path="/login"
                    element={
                      <Login
                        setIsAuthenticatedLS={setIsAuthenticatedLS}
                        setLocale={setLocale}
                      />
                    }
                  />
                  <Route
                    path="/*"
                    element={
                      isAuthenticatedLS ? <Main /> : <Navigate to="/login" />
                    }
                  />
                </Routes>
              </div>
              {isAuthenticatedLS && <Footer />}
            </div>
          </Router>
        </NavProvider>
      </IntlProvider>
    </Provider>
  );
}

export default App;
