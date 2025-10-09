import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Helmet } from 'react-helmet';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <>
        <Helmet>
            <link rel="icon" type="image/x-icon" href="../../public/images/favicon.ico" />
        </Helmet>
        <App />
    </>
)