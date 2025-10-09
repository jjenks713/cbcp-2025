import React from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import { Stack } from "@mui/material";

const Layout = () => {
    return (
        <Stack minHeight="100vh" style={{
        height: '100vh',
        backgroundImage: `url(${require('../skull-study.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }}>
            <Navigation />
            <Outlet />
        </Stack>
    );
};

export default Layout;