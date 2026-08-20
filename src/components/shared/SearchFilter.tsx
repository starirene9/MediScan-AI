import React from "react";
import { Box, TextField } from "@mui/material";

interface SearchFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  setSearchTerm,
  label = "Search",
  placeholder,
}) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ width: { xs: "100%", sm: "50%", md: "50%", lg: "50%" } }}>
        <TextField
          fullWidth
          label={label}
          placeholder={placeholder}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
        />
      </Box>
    </Box>
  );
};

export default SearchFilter;
