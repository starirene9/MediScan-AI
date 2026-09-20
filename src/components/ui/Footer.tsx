import packageJson from "../../../package.json";
import MedicalChatbot from "../shared/MedicalChatbot";
import { useNav } from "../../context/NavContext";

const Footer = () => {
  const { isOpen } = useNav();

  return (
    <footer
      className={`text-white pr-3 h-12 w-full flex items-center justify-between gap-3 fixed bottom-0 z-20 transition-all duration-300 ${
        isOpen ? "pl-44" : "pl-22"
      }`}
      style={{ backgroundColor: "var(--color-footer)" }}
    >
      <div className="flex items-center min-w-0">
        <MedicalChatbot />
      </div>
      <p className="font-normal text-sm shrink-0 pr-2">
        © 2026 MediScan AI by Bitna Gu | v{packageJson.version}
      </p>
    </footer>
  );
};

export default Footer;
