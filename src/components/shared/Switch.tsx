import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";

interface SwtichProps {
  name: string;
  labelPlacement?: "start" | "end" | "top" | "bottom";
  labelStyle?: React.CSSProperties;
  checked: boolean;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FormControlLabelPosition({
  name,
  labelPlacement = "start",
  labelStyle = {},
  checked = false,
  handleChange,
}: SwtichProps) {
  return (
    <FormControl component="fieldset">
      <FormGroup aria-label="position" row>
        <FormControlLabel
          control={
            <Switch color="primary" checked={checked} onChange={handleChange} />
          }
          label={<span style={labelStyle}>{name}</span>}
          labelPlacement={labelPlacement}
        />
      </FormGroup>
    </FormControl>
  );
}
