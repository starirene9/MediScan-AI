import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Box from "@mui/material/Box";
import { SxProps, Theme } from "@mui/material";

interface VariantButtonGroupProps {
  buttons: string[];
  onClickHandlers?: ((event: React.MouseEvent<HTMLButtonElement>) => void)[];
  buttonStyles?: SxProps<Theme>[];
  groupStyle?: SxProps<Theme>;
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
}

export default function VariantButtonGroup({
  buttons,
  onClickHandlers = [],
  buttonStyles = [],
  groupStyle = {},
  variant = "outlined",
  size = "small",
}: VariantButtonGroupProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        "& > *": {
          m: 1,
        },
      }}
    >
      <ButtonGroup
        variant={variant}
        size={size}
        aria-label="Basic button group"
        sx={groupStyle}
      >
        {buttons?.map((label, index) => (
          <Button
            key={index}
            onClick={onClickHandlers[index] || (() => {})}
            sx={buttonStyles[index] || {}}
          >
            {label}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}
