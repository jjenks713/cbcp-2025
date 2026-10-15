import React, { useState } from 'react';
import { Button, Stack, Typography, IconButton, Drawer, Box } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/use-responsive';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'About', path: '/about' },
];

const Navigation = () => {
    const navigate = useNavigate();
    const mdUp = useResponsive('up', 'md');
    const [mobileOpen, setMobileOpen] = useState(false);

    const go = (path: string) => {
        navigate(path);
        setMobileOpen(false);
    };

    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            py={2}
            px={{ xs: 2, sm: 3, md: 4 }}
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: (theme) => theme.zIndex.appBar,
                bgcolor: 'secondary.main',
            }}
        >
            <Typography variant="h3" sx={{ lineHeight: 0 }}>
                <img
                    src={require('./CBCP-Cube-big.png')}
                    alt="Logo"
                    width={"100px"}
                    style={{ cursor: 'pointer', maxWidth: '28vw', height: 'auto' }}
                    onClick={() => go('/')}
                />
            </Typography>

            {mdUp ? (
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                    {NAV_LINKS.map((link) => (
                        <Button key={link.path} variant={link.path === '/' ? undefined : 'text'} onClick={() => go(link.path)}>
                            {link.label}
                        </Button>
                    ))}
                    <IconButton onClick={() => go('/cart')} color="primary">
                        <ShoppingCartIcon />
                    </IconButton>
                </Stack>
            ) : (
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton onClick={() => go('/cart')} color="primary" aria-label="Cart">
                        <ShoppingCartIcon />
                    </IconButton>
                    <IconButton onClick={() => setMobileOpen(true)} aria-label="Open menu" sx={{ color: 'common.white' }}>
                        <MenuIcon />
                    </IconButton>
                </Stack>
            )}

            <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
                <Box sx={{ width: 240, pt: 2, bgcolor: 'secondary.main', height: 1 }}>
                    <Stack direction="row" justifyContent="flex-end" px={2} pb={1}>
                        <IconButton onClick={() => setMobileOpen(false)} aria-label="Close menu" sx={{ color: 'common.white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                    <Stack spacing={1} px={2}>
                        {NAV_LINKS.map((link) => (
                            <Button
                                key={link.path}
                                fullWidth
                                size="large"
                                sx={{ justifyContent: 'flex-start' }}
                                onClick={() => go(link.path)}
                            >
                                {link.label}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            </Drawer>
        </Stack>
    )
};

export default Navigation;
