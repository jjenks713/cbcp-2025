import React from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import { Stack } from "@mui/material";

const Layout = () => {
    return (
        <Stack minHeight="100vh" sx={{ bgcolor: 'secondary.main' }}>
            <Navigation />
            <Outlet />
        </Stack>
    );
};

export default Layout;