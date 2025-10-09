import React from "react";
import { useRoutes } from "react-router-dom";
import Layout from "./Layout";
import Main from "../Features/Main";
import About from "../Features/About";

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
                path: "about",
                element: <About />,
            }
        ],
    }
];

export default function Routes() {
    return useRoutes(routes);
}