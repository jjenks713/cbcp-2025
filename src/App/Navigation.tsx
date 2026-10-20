import React, { useState } from 'react';
import { Button, Stack, Typography, IconButton, Drawer, Box, Avatar, Badge, Menu, MenuItem, Divider, ListItemIcon } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResponsive } from '../hooks/use-responsive';
import { useShopEnabled } from '../hooks/use-shop-link';
import { useCart } from '../lib/cart-context';import CartDrawer from '../Features/Shop/CartDrawer';
import ItemDrawer from '../Features/Shop/ItemDrawer';
import { useAuth, hasRole, type AuthUser } from '../lib/auth-context';
import { ETSY_SHOP_URL } from '../lib/links';
import { scrollToTopAndReset } from '../lib/scrollReset';

type NavLink = { label: string; path: string; external?: boolean };

const SITE_LINKS: NavLink[] = [
    { label: 'Home', path: '/' },
    { label: 'Gallery', path: '/gallery' },
    // Jumps to the "Meet the Artist" section on the landing page rather
    // than a separate page — see Routes.tsx for the scroll-to-hash effect.
    { label: 'About', path: '/#meet-the-artist' },
];

// The in-app shop while the hide-cbcp-shop flag is off; Etsy otherwise
// (including before LaunchDarkly has loaded, since the flag defaults to hidden).
const shopLink = (shopEnabled: boolean): NavLink =>
    shopEnabled ? { label: 'Shop', path: '/shop' } : { label: 'Shop', path: ETSY_SHOP_URL, external: true };

// Nav labels show as written ("Home", "Log Out"), not the buttons' default all caps.
const LINK_SX = { textTransform: 'none' } as const;

// Desktop nav links also sit closer together than the theme's default
// button padding (30px a side, forced with !important) allows.
const DESKTOP_LINK_SX = { ...LINK_SX, padding: '8px 12px !important', minWidth: 0 };
const DRAWER_LINK_SX = { ...LINK_SX, justifyContent: 'flex-start' };

// "Josh Jenkin" -> "JJ"; falls back to the email's first letter.
function initials(user: AuthUser) {
    const fromName = [user.firstName, user.lastName].map((part) => part?.trim().charAt(0) ?? '').join('');
    return (fromName || user.email.charAt(0)).toUpperCase();
}

const Navigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const shopEnabled = useShopEnabled();
    const NAV_LINKS = [...SITE_LINKS, shopLink(shopEnabled)];
    const { count: cartCount, openDrawer: openCart } = useCart();
    // Opens the cart drawer; only shown while the in-app shop is on.
    const cartButton = shopEnabled && (
        <IconButton onClick={openCart} color="primary" aria-label={`Open cart (${cartCount} item${cartCount === 1 ? '' : 's'})`}>
            <Badge badgeContent={cartCount} color="error">
                <ShoppingCartIcon />
            </Badge>
        </IconButton>
    );
    const mdUp = useResponsive('up', 'md');
    const [mobileOpen, setMobileOpen] = useState(false);
    // Anchor for the user menu opened from the avatar (desktop).
    const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
    // Where a logged-in user's own pages live - in the avatar menu on
    // desktop, at the bottom of the drawer on mobile.
    const accountLinks = [
        { label: 'Account', path: '/account', icon: <PersonIcon fontSize="small" /> },
        ...(hasRole(user, 'admin')
            ? [{ label: 'Admin', path: '/account/admin', icon: <EditNoteIcon fontSize="small" /> }]
            : []),
    ];
    const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '';

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
        setUserMenuAnchor(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileOpen(false);
        setUserMenuAnchor(null);
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
                <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                    {NAV_LINKS.map((link) => (
                        <Button key={link.path} variant={link.path === '/' ? undefined : 'text'} sx={DESKTOP_LINK_SX} onClick={() => go(link.path, link.external)}>
                            {link.label}
                        </Button>
                    ))}
                    {cartButton}
                    {user && (
                        <>
                            <IconButton
                                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                                aria-label="Open account menu"
                                aria-haspopup="menu"
                                aria-expanded={Boolean(userMenuAnchor)}
                                sx={{ ml: 1, p: 0.5 }}
                            >
                                <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: 'primary.main', color: 'secondary.main' }}>
                                    {initials(user)}
                                </Avatar>
                            </IconButton>
                            <Menu
                                anchorEl={userMenuAnchor}
                                open={Boolean(userMenuAnchor)}
                                onClose={() => setUserMenuAnchor(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                slotProps={{
                                    paper: {
                                        sx: { mt: 1, minWidth: 200, bgcolor: 'secondary.main', color: 'common.white', border: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
                                    },
                                }}
                            >
                                <Box sx={{ px: 2, py: 1 }}>
                                    {userName && <Typography sx={{ fontWeight: 600 }}>{userName}</Typography>}
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{user.email}</Typography>
                                </Box>
                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                                {accountLinks.map((link) => (
                                    <MenuItem key={link.path} selected={location.pathname === link.path} onClick={() => go(link.path)}>
                                        <ListItemIcon sx={{ color: 'inherit' }}>{link.icon}</ListItemIcon>
                                        {link.label}
                                    </MenuItem>
                                ))}
                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon sx={{ color: 'inherit' }}><LogoutIcon fontSize="small" /></ListItemIcon>
                                    Log Out
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Stack>
            ) : (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    {cartButton}
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
                                sx={DRAWER_LINK_SX}
                                onClick={() => go(link.path, link.external)}
                            >
                                {link.label}
                            </Button>
                        ))}
                        {user && (
                            <>
                                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                                {accountLinks.map((link) => (
                                    <Button
                                        key={link.path}
                                        fullWidth
                                        size="large"
                                        startIcon={link.icon}
                                        sx={DRAWER_LINK_SX}
                                        onClick={() => go(link.path)}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                                <Button
                                    fullWidth
                                    size="large"
                                    startIcon={<LogoutIcon fontSize="small" />}
                                    sx={DRAWER_LINK_SX}
                                    onClick={handleLogout}
                                >
                                    Log Out
                                </Button>
                            </>
                        )}
                    </Stack>
                </Box>
            </Drawer>

            {shopEnabled && (
                <>
                    <CartDrawer />
                    <ItemDrawer />
                </>
            )}
        </Stack>
    )
};

export default Navigation;
