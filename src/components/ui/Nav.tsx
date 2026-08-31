import { Link, useLocation } from "react-router-dom";
import { Tooltip } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNav } from "../../context/NavContext";
import { useIntl } from "react-intl";

const Nav = () => {
  const { isOpen, setIsOpen } = useNav();
  const location = useLocation();
  const intl = useIntl();

  const items = [
    {
      to: "/",
      icon: <DashboardIcon />,
      label: intl.formatMessage({ id: "dashboard" }),
    },
    {
      to: "/studies",
      icon: <ListAltIcon />,
      label: intl.formatMessage({ id: "studies_worklist" }),
    },
    {
      to: "/upload",
      icon: <CloudUploadIcon />,
      label: intl.formatMessage({ id: "upload_xray" }),
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={`text-white fixed left-0 top-20 h-[calc(100vh-5rem)] p-6 flex flex-col space-y-4 transition-all duration-300 z-50 ${
        isOpen ? "w-44" : "w-22"
      }`}
      style={{ backgroundColor: "var(--color-nav)" }}
    >
      {items.map(({ to, icon, label }) => (
        <Tooltip key={to} title={!isOpen ? label : ""} placement="right">
          <Link
            to={to}
            className="py-2 px-2 rounded-md flex items-center space-x-2 transition-all duration-200"
            style={{
              backgroundColor: isActive(to)
                ? "var(--color-nav-hover)"
                : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive(to)) {
                e.currentTarget.style.backgroundColor = "var(--color-nav-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(to)) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {icon}
            {isOpen && <span>{label}</span>}
          </Link>
        </Tooltip>
      ))}
      <button
        className="mt-auto mb-4 p-2 rounded-md flex items-center justify-center"
        style={{ backgroundColor: "transparent" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-nav-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </button>
    </nav>
  );
};

export default Nav;
