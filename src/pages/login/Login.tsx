import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Paper,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import useLocalStorage from "../../hooks/useLocalStorage";
import { AuthProps } from "../../App";
import BrandLogo from "../../components/shared/BrandLogo";
import ColorModeToggle from "../../components/shared/ColorModeToggle";
import { APP_NAME } from "../../config/features";
import { useIntl } from "react-intl";

const Login: React.FC<AuthProps> = ({ setIsAuthenticatedLS, setLocale }) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [, setStoredUserName] = useLocalStorage("username", "");
  const navigate = useNavigate();
  const intl = useIntl();

  const adminAccount = {
    username: import.meta.env.VITE_ADMIN_USERNAME,
    password: import.meta.env.VITE_ADMIN_PASSWORD,
  };
  const userAccount = {
    username: import.meta.env.VITE_USER_USERNAME,
    password: import.meta.env.VITE_USER_PASSWORD,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (credentials.username === adminAccount.username &&
        credentials.password === adminAccount.password) ||
      (credentials.username === userAccount.username &&
        credentials.password === userAccount.password)
    ) {
      setLocale("en");
      setIsAuthenticatedLS(true);
      setStoredUserName(credentials.username);
      navigate("/");
    } else {
      alert("Invalid username or password");
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: "100vh",
        width: "100%",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <ColorModeToggle />
      </Box>

      <Paper
        elevation={4}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
            gap: 1,
          }}
        >
          <BrandLogo
            size={72}
            showName={false}
            href={false}
            logoBackground="paper"
          />
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {APP_NAME}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {intl.formatMessage({ id: "login_subtitle" })}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            variant="outlined"
            value={credentials.username}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            value={credentials.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button fullWidth variant="contained" type="submit" size="large">
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
