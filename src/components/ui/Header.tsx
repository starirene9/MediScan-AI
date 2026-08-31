import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { IconButton } from "@mui/material";
import useLocalStorage from "../../hooks/useLocalStorage";
import { AuthProps } from "../../App";
import userImage from "../../assets/user.png";
import DigitalClock from "../shared/DigitalClock";
import BrandLogo from "../shared/BrandLogo";
import VariantButtonGroup from "../shared/ButtonGroup";
import ColorModeToggle from "../shared/ColorModeToggle";
import { languageButtons, languageCodes } from "../../utils";
import { useIntl } from "react-intl";

interface HeaderProps extends AuthProps {
  setLocale: (lang: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsAuthenticatedLS, setLocale }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [storedUserName] = useLocalStorage("username", "Guest");
  const intl = useIntl();
  const [language, setLanguage] = useState(intl.locale);
  const navigate = useNavigate();

  useEffect(() => {
    setLanguage(intl.locale);
  }, [intl.locale]);

  const buttonStyles = languageCodes.map((code) => ({
    backgroundColor:
      language === code ? "var(--color-azure)" : "var(--color-light-silver)",
    color: language === code ? "var(--color-white)" : "var(--color-black)",
    "&:hover": { backgroundColor: "var(--color-azure)" },
  }));

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    setIsAuthenticatedLS(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("locale");
    navigate("/login");
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setLocale(lang);
    localStorage.setItem("locale", lang);
  };

  const onClickHandlers = languageCodes.map(
    (code) => () => handleLanguageChange(code)
  );

  return (
    <header
      className="p-4 text-white fixed w-full top-0 h-20 flex items-center justify-between px-6"
      style={{ backgroundColor: "var(--color-shell)" }}
    >
      <div className="flex items-center gap-6">
        <BrandLogo size={44} nameVariant="h5" />
        <DigitalClock />
      </div>
      <div className="flex items-center gap-8">
        <VariantButtonGroup
          buttonStyles={buttonStyles}
          buttons={languageButtons}
          onClickHandlers={onClickHandlers}
          variant="text"
          size="small"
        />
        <ColorModeToggle iconColor="var(--color-white)" />
        <IconButton onClick={handleOpenMenu} onMouseEnter={handleOpenMenu}>
          <Avatar
            alt={storedUserName}
            src={userImage}
            sx={{ width: 48, height: 48, border: "1px solid gray" }}
          />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleCloseMenu}
          onMouseLeave={handleCloseMenu}
        >
          <MenuItem sx={{ pointerEvents: "none" }}>
            {intl.formatMessage({ id: "welcome" }, { name: storedUserName })}
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            {intl.formatMessage({ id: "logout" })}
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
};

export default Header;
