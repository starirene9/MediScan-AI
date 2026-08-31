import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import logo from "../../assets/mediscan-logo.png";
import { APP_NAME } from "../../config/features";

interface BrandLogoProps {
  size?: number;
  showName?: boolean;
  nameVariant?: "h5" | "h6" | "subtitle1";
  href?: string | false;
  nameColor?: string;
  logoBackground?: "white" | "paper";
}

const BrandLogo = ({
  size = 40,
  showName = true,
  nameVariant = "h5",
  href = "/",
  nameColor = "white",
  logoBackground = "white",
}: BrandLogoProps) => {
  const content = (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.25,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <Box
        component="img"
        src={logo}
        alt={APP_NAME}
        sx={{
          width: size,
          height: size,
          borderRadius: 1.5,
          bgcolor: logoBackground === "paper" ? "background.paper" : "white",
          objectFit: "contain",
          flexShrink: 0,
        }}
      />
      {showName && (
        <Typography
          variant={nameVariant}
          sx={{ fontWeight: 700, letterSpacing: 0.5, color: nameColor }}
        >
          {APP_NAME}
        </Typography>
      )}
    </Box>
  );

  if (href) {
    return (
      <Box component={Link} to={href} sx={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Box>
    );
  }

  return content;
};

export default BrandLogo;
