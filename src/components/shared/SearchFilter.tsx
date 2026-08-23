import React from "react";
import { Box, TextField } from "@mui/material";

interface SearchFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
  maxWidth?: number | string | { xs?: string | number; sm?: string | number; md?: string | number; lg?: string | number };
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  setSearchTerm,
  label = "Search",
  placeholder,
  showLabel = true,
  maxWidth,
}) => {
  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Box sx={{ width: "100%", maxWidth: maxWidth ?? { xs: "100%", sm: "100%" } }}>
        <TextField
          fullWidth
          label={showLabel ? label : undefined}
          placeholder={placeholder ?? (showLabel ? undefined : label)}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputLabelProps={showLabel ? undefined : { shrink: false }}
        />
      </Box>
    </Box>
  );
};

export default SearchFilter;
