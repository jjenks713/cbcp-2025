import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { ThemeProvider } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

import cubeLogo from '../App/CBCP-Cube-big.png';
import { createAdminTheme } from '../Theme';
import { useResponsive } from '../hooks/use-responsive';
import { useAuth, hasRole, type AuthUser } from '../lib/auth-context';

// Sections of the account page, each its own route (see App/Routes.tsx) so
// Admin can be linked to and is guarded by RequireAuth like any admin route.
const SECTIONS = [
  { value: '/account', label: 'Account info' },
  { value: '/account/admin', label: 'Admin' },
];

// The account page. Admins get a section picker beside the heading to
// switch between their account info and the content editor; everyone else
// just sees their account info.
export default function Account() {
  const theme = useMemo(() => createAdminTheme(), []);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const section = pathname.startsWith('/account/admin') ? '/account/admin' : '/account';

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, color: 'text.primary' }}>
        <Stack spacing={4}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Typography variant="h3" sx={{ color: 'primary.main' }}>
              Account
            </Typography>
            {hasRole(user, 'admin') && (
              <TextField
                select
                size="small"
                value={section}
                onChange={(e) => navigate(e.target.value)}
                slotProps={{ htmlInput: { 'aria-label': 'Account section' } }}
                sx={{ minWidth: 160 }}
              >
                {SECTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>

          <Outlet />
        </Stack>
      </Container>
    </ThemeProvider>
  );
}

type ProfileForm = { firstName: string; lastName: string; address: string };

const toForm = (user: AuthUser | null): ProfileForm => ({
  firstName: user?.firstName ?? '',
  lastName: user?.lastName ?? '',
  address: user?.address ?? '',
});

// The user's own details on the left; the panel to the right of the
// divider shows the logo until the pencil opens the edit form there (and
// is where more account features will go). Email isn't editable - it's
// their login.
export function AccountDetails() {
  const mdUp = useResponsive('up', 'md');
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={4}
      divider={<Divider orientation={mdUp ? 'vertical' : 'horizontal'} flexItem />}
    >
      <Stack spacing={2} alignItems="flex-start" sx={{ width: { md: `${100 / 6}%` }, flexShrink: 0, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h5" sx={{ color: name ? 'text.primary' : 'text.secondary' }}>
            {name || 'No name added'}
          </Typography>
          {/* Pencil opens the edit form; it becomes an X that closes it (same as Cancel). */}
          <Tooltip title={editing ? 'Close' : 'Edit'}>
            <IconButton
              size="small"
              aria-label={editing ? 'Close edit form' : 'Edit account info'}
              onClick={() => {
                setSaved(false);
                setEditing(!editing);
              }}
            >
              {editing ? <CloseIcon fontSize="small" /> : <EditIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
        <Typography sx={{ overflowWrap: 'anywhere' }}>{user?.email}</Typography>
        <Typography
          sx={{
            whiteSpace: 'pre-line',
            color: user?.address ? 'text.primary' : 'text.secondary',
          }}
        >
          {user?.address || 'No address added'}
        </Typography>
        {hasRole(user, 'admin') && (
          <Typography sx={{ color: 'text.secondary' }}>Roles: {user?.roles.join(', ')}</Typography>
        )}
        {saved && (
          <Alert severity="success" onClose={() => setSaved(false)}>
            Saved
          </Alert>
        )}
      </Stack>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <ProfileEditForm
            user={user}
            onSave={async (fields) => {
              await updateProfile(fields);
              setEditing(false);
              setSaved(true);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 1,
              py: { xs: 2, md: 4 },
            }}
          >
            <Box
              component="img"
              src={cubeLogo}
              alt="Creepy but Cute Press"
              sx={{ width: { xs: 160, md: 220 }, height: 'auto', opacity: 0.9 }}
            />
          </Box>
        )}
      </Box>
    </Stack>
  );
}

type ProfileEditFormProps = {
  user: AuthUser | null;
  onSave: (fields: { firstName: string | null; lastName: string | null; address: string | null }) => Promise<void>;
  onCancel: () => void;
};

function ProfileEditForm({ user, onSave, onCancel }: ProfileEditFormProps) {
  const [values, setValues] = useState<ProfileForm>(() => toForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const original = toForm(user);
  const changed = (Object.keys(values) as (keyof ProfileForm)[]).some((key) => values[key].trim() !== original[key]);

  const setValue = (key: keyof ProfileForm) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        firstName: values.firstName.trim() || null,
        lastName: values.lastName.trim() || null,
        address: values.address.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} noValidate spacing={2.5} sx={{ maxWidth: 480 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="First name"
          value={values.firstName}
          onChange={setValue('firstName')}
          disabled={saving}
          autoFocus
          autoComplete="given-name"
          slotProps={{ htmlInput: { maxLength: 100 } }}
          fullWidth
        />
        <TextField
          label="Last name"
          value={values.lastName}
          onChange={setValue('lastName')}
          disabled={saving}
          autoComplete="family-name"
          slotProps={{ htmlInput: { maxLength: 100 } }}
          fullWidth
        />
      </Stack>
      <TextField
        label="Email"
        value={user?.email ?? ''}
        helperText="This is your login, so it can't be changed here"
        slotProps={{ input: { readOnly: true } }}
        fullWidth
      />
      <TextField
        label="Address"
        value={values.address}
        onChange={setValue('address')}
        disabled={saving}
        autoComplete="street-address"
        multiline
        minRows={3}
        slotProps={{ htmlInput: { maxLength: 500 } }}
        fullWidth
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction="row" spacing={2}>
        <Button type="submit" variant="contained" color="primary" disabled={!changed || saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
}
