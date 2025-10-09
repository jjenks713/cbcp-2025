import { Stack, Typography } from '@mui/material';
import React from 'react';

const Main = () => {
    return (
        <Stack>
            <Typography variant="h3" align="center" gutterBottom style={{ marginTop: '20px' }}>
                This is the place
            </Typography>
            <Typography variant="h6" align="center" gutterBottom style={{ marginTop: '20px' }}>
                Explore our website to learn more about the event, speakers, and schedule.
            </Typography>
        </Stack>
    );
};

export default Main;