import React from 'react';
import { Button, Stack, Typography, IconButton } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';

const Navigation = () => {
    const navigate = useNavigate();

    return (
        <Stack direction="row" justifyContent="space-between" py={2} px={4}>
            <Typography variant="h3">
                <img src={require('./CBCP-Cube-big.png')} alt="Logo" width={"100px"} />
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent={"center"}>
                <Button onClick={() => navigate('/')}>Home</Button>
                <Button variant='text' onClick={() => navigate('/about')}>About</Button>
                <IconButton onClick={() => navigate('/cart')} color="primary">
                    <ShoppingCartIcon />
                </IconButton>
            </Stack>
        </Stack>
    )
};

export default Navigation;