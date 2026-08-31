import { IconButton, Tooltip } from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useIntl } from "react-intl";
import { useColorMode } from "../../context/ColorModeContext";

interface ColorModeToggleProps {
  iconColor?: string;
}

const ColorModeToggle = ({ iconColor }: ColorModeToggleProps) => {
  const intl = useIntl();
  const { mode, toggleColorMode } = useColorMode();
  const isDark = mode === "dark";

  return (
    <Tooltip
      title={intl.formatMessage({
        id: isDark ? "dark_mode_on" : "dark_mode_off",
      })}
    >
      <IconButton
        onClick={toggleColorMode}
        aria-label={intl.formatMessage({ id: "dark_mode" })}
        sx={iconColor ? { color: iconColor } : undefined}
      >
        {isDark ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ColorModeToggle;
