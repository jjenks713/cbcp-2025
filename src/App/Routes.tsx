import React, { useEffect } from "react";
import { useRoutes, useLocation } from "react-router-dom";
import Layout from "./Layout";
import RequireAuth from "./RequireAuth";
import Main from "../Features/Main";
import Gallery from "../Features/Gallery";
import Login from "../Features/Login";
import Account from "../Features/Account";
import Admin from "../Features/Admin/Admin";
import AuthRerouteProvider from "./AuthProvider";

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
                    },
                ],
            },
            {
                element: <RequireAuth role="admin" />,
                children: [
                    {
                        path: "admin",
                        element: <Admin />,
                    },
                ],
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