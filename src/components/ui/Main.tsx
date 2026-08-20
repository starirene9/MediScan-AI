import { Routes, Route } from "react-router-dom";
import { useNav } from "../../context/NavContext";
import Dashboard from "../../pages/dashboard/Dashboard";
import StudiesWorklist from "../../pages/studies/StudiesWorklist";
import StudyDetail from "../../pages/studies/StudyDetail";
import XrayUpload from "../../pages/upload/XrayUpload";
import PageNotFound from "./PageNotFound";

const Main = () => {
  const { isOpen } = useNav();

  return (
    <main
      className={`transition-all duration-300 mt-20 p-3 flex-1 overflow-y-auto h-[calc(100vh-128px)] bg-gray-100 ${
        isOpen ? "ml-44" : "ml-22"
      }`}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/studies" element={<StudiesWorklist />} />
        <Route path="/studies/:id" element={<StudyDetail />} />
        <Route path="/upload" element={<XrayUpload />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </main>
  );
};

export default Main;
