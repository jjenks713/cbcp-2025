import React from "react";
import { useRoutes } from "react-router-dom";
import Layout from "./Layout";
import Main from "../Features/Main";
import About from "../Features/About";
import Gallery from "../Features/Gallery";

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
            },
            {
                path: "gallery",
                element: <Gallery />,
            }
        ],
    }
];

export default function Routes() {
    return useRoutes(routes);
}