import React, { useState } from 'react';
import { Button, Stack, Typography, IconButton, Drawer, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResponsive } from '../hooks/use-responsive';
import { useAuth } from '../lib/auth-context';
import { ETSY_SHOP_URL } from '../lib/links';
import { scrollToTopAndReset } from '../lib/scrollReset';

const NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Gallery', path: '/gallery' },
    // Jumps to the "Meet the Artist" section on the landing page rather
    // than a separate page — see Routes.tsx for the scroll-to-hash effect.
    { label: 'About', path: '/#meet-the-artist' },
    // In-app shop isn't built yet — goes to Etsy for now.
    { label: 'Shop', path: ETSY_SHOP_URL, external: true },
];

const Navigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const mdUp = useResponsive('up', 'md');
    const [mobileOpen, setMobileOpen] = useState(false);
    const navLinks = [
        ...NAV_LINKS,
        ...(user ? [{ label: 'Account', path: '/account' }] : []),
        ...(user?.role === 'admin' ? [{ label: 'Admin', path: '/admin' }] : []),
    ];

    const go = (path: string, external?: boolean) => {
        if (external) {
            window.open(path, '_blank', 'noopener');
        } else if (path === '/' && location.pathname === '/') {
            // Already on the landing page — a plain navigate('/') is a
            // no-op here, so scroll to top (and replay the reveal
            // animations) instead of doing nothing.
            scrollToTopAndReset();
        } else {
            navigate(path);
        }
        setMobileOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                    {navLinks.map((link) => (
                        <Button key={link.path} variant={link.path === '/' ? undefined : 'text'} onClick={() => go(link.path, link.external)}>
                            {link.label}
                        </Button>
                    ))}
                    {user && <Button variant="text" onClick={handleLogout}>Log Out</Button>}
                </Stack>
            ) : (
                <IconButton onClick={() => setMobileOpen(true)} aria-label="Open menu" sx={{ color: 'common.white' }}>
                    <MenuIcon />
                </IconButton>
            )}

            <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
                <Box sx={{ width: 240, pt: 2, bgcolor: 'secondary.main', height: 1 }}>
                    <Stack direction="row" justifyContent="flex-end" px={2} pb={1}>
                        <IconButton onClick={() => setMobileOpen(false)} aria-label="Close menu" sx={{ color: 'common.white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                    <Stack spacing={1} px={2}>
                        {navLinks.map((link) => (
                            <Button
                                key={link.path}
                                fullWidth
                                size="large"
                                sx={{ justifyContent: 'flex-start' }}
                                onClick={() => go(link.path, link.external)}
                            >
                                {link.label}
                            </Button>
                        ))}
                        {user && (
                            <Button
                                fullWidth
                                size="large"
                                sx={{ justifyContent: 'flex-start' }}
                                onClick={handleLogout}
                            >
                                Log Out
                            </Button>
                        )}
                    </Stack>
                </Box>
            </Drawer>
        </Stack>
    )
};

export default Navigation;
