import React, { lazy, Suspense, useEffect } from "react";
import { useRoutes, useLocation, Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Layout from "./Layout";
import RequireAuth from "./RequireAuth";
import Main from "../Features/Main";
import Gallery from "../Features/Gallery";
import Login from "../Features/Login";
import Account, { AccountDetails } from "../Features/Account";
import AuthRerouteProvider from "./AuthProvider";
import ShopGate from "./ShopGate";

// Split into its own bundle, downloaded only when an admin opens the tab.
const Admin = lazy(() => import("../Features/Admin/Admin"));
// Likewise only loaded once someone visits the shop (and it's switched on).
const Shop = lazy(() => import("../Features/Shop/Shop"));
const Cart = lazy(() => import("../Features/Shop/Cart"));
const Checkout = lazy(() => import("../Features/Shop/Checkout"));

const pageFallback = (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress color="primary" />
    </Box>
);

const routes = [
    {
        path: "",
        element: <Layout />,
        children: [
            {
                path: "",
                element: <Main />,
            },
            {
                path: "gallery",
                element: <Gallery />,
            },
            {
                // Behind the hide-cbcp-shop flag; /shop/:categorySlug is the
                // same page filtered to a category.
                element: <ShopGate />,
                children: [
                    {
                        path: "shop/:categorySlug?",
                        element: (
                            <Suspense fallback={pageFallback}>
                                <Shop />
                            </Suspense>
                        ),
                    },
                    {
                        path: "cart",
                        element: (
                            <Suspense fallback={pageFallback}>
                                <Cart />
                            </Suspense>
                        ),
                    },
                    {
                        path: "checkout",
                        element: (
                            <Suspense fallback={pageFallback}>
                                <Checkout />
                            </Suspense>
                        ),
                    },
                ],
            },
            {
                element: <AuthRerouteProvider />,
                children: [
                    {
                        path: "login",
                        element: <Login />,
                    },
                ],
            },
            {
                element: <RequireAuth />,
                children: [
                    {
                        path: "account",
                        element: <Account />,
                        children: [
                            {
                                index: true,
                                element: <AccountDetails />,
                            },
                            {
                                element: <RequireAuth role="admin" />,
                                children: [
                                    {
                                        path: "admin",
                                        element: (
                                            <Suspense fallback={pageFallback}>
                                                <Admin />
                                            </Suspense>
                                        ),
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                // The admin panel used to be its own page - keep old links working.
                path: "admin",
                element: <Navigate to="/account/admin" replace />,
            },
        ],
    }
];

export default function Routes() {
    const location = useLocation();

    // Supports links like "/#meet-the-artist" — jump to an in-page section
    // instead of (or after navigating to) a route. Sections above the
    // target can still be loading their own data (e.g. the artwork grid
    // only renders once its Contentful fetch resolves), which shifts the
    // page height right after we've already scrolled — so this re-targets
    // a few times as that settles in, rather than scrolling just once.
    useEffect(() => {
        if (!location.hash) return;
        const id = location.hash.slice(1);

        const scrollToTarget = () => {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        };

        scrollToTarget();
        const timers = [150, 400, 800, 1500].map((delay) => setTimeout(scrollToTarget, delay));
        return () => timers.forEach(clearTimeout);
    }, [location]);

    return useRoutes(routes);
}