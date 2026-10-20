import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navigation from "./Navigation";
import { Box, Stack } from "@mui/material";
import ContentColumn from "../components/ContentColumn";
import { backgroundPatternLayer } from "../lib/background";

// Pages that arrange their own ContentColumn(s) around full-width banners
// instead of sitting in one column (the home page's hero, artist and
// contact sections stretch edge to edge).
const SELF_COLUMNED_PATHS = ["/"];

const Layout = () => {
    const { pathname } = useLocation();
    const selfColumned = SELF_COLUMNED_PATHS.includes(pathname);

    return (
        <Stack minHeight="100vh" sx={{ bgcolor: 'secondary.main', position: 'relative', isolation: 'isolate' }}>
            {/*
              Confetti pattern over the background color, behind all page
              content. Fixed to the viewport, so it stays put while pages
              scroll (the nav shows the same pattern, aligned to this).
            */}
            <Box aria-hidden sx={{ position: 'fixed', inset: 0, zIndex: 0, ...backgroundPatternLayer }} />
            <Navigation />
            {/* Above the pattern layer */}
            <Box sx={{ position: 'relative', zIndex: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {selfColumned ? (
                    <Outlet />
                ) : (
                    <ContentColumn sx={{ flexGrow: 1 }}>
                        <Outlet />
                    </ContentColumn>
                )}
            </Box>
        </Stack>
    );
};

export default Layout;
