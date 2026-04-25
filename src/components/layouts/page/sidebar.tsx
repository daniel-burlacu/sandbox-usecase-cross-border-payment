import {
  Box,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import MenuBookTwoToneIcon from '@mui/icons-material/MenuBookTwoTone';
import { useInitiatedTransactions } from '@/hooks/initiated-transactions';

import { Drawer } from '@/components/ui/drawer/drawer'
import { paths } from '@/config/paths';

type SideNavigationItem = {
  name: string;
  to: string;
  icon: string;
  count?: number;
  disabled?: boolean;
};

const drawerWidth = 240;

type SidebarProps = {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  numberOfTransactions?: number | 0;
};

export const Sidebar = ({ isSidebarOpen, openSidebar, numberOfTransactions }: SidebarProps) => {
  const theme = useTheme();
  const { transactionsInitiated } = useInitiatedTransactions();
  const [txInitiated, setTransactionsInitiated] = useState(0);
  const [txNumber, setTxNumber] = useState(0);

  useEffect(() => {
    setTransactionsInitiated(transactionsInitiated.length);
    if (numberOfTransactions !== undefined) {
      setTxNumber(Math.max(0, numberOfTransactions - transactionsInitiated.length));
    }
  }, [transactionsInitiated, numberOfTransactions]);
  const navigation = [
    { name: 'Dashboard', to: paths.app.dashboard.getHref(), icon: 'space_dashboard' },
    { name: 'Outstanding', to: paths.app.transactions.getHref(), icon: 'content_paste', count: txNumber },
    { name: 'Payment-Log', to: paths.app.transactionsInitiated.getHref(), icon: <MenuBookTwoToneIcon />, count: txInitiated },
    { name: 'Submit Batch', to: paths.app.batch.getHref(), icon: 'upload_file' },
    // { name: 'Feedbacks', to: paths.app.feedbacks.getHref(), icon: 'chat_bubble', count: 23, disabled: true }, // TODO: Add items count
    // { name: 'Map View', to: paths.app.mapView.getHref(), icon: 'map', disabled: true },
  ].filter(Boolean) as SideNavigationItem[];

  const footer = [
    { name: 'GovStack', to: 'https://govstack.global/', icon: 'open_in_new' },
    { name: 'Mifos', to: 'https://mifos.org/', icon: 'open_in_new' },
  ].filter(Boolean) as SideNavigationItem[];

  return (
    <Drawer
      closedwidth={`calc(${theme.spacing(8)} + 1px)`}
      openwidth={`${drawerWidth}px`}
      variant="permanent"
      open={isSidebarOpen}
      sx={{
        backgroundColor: '#FCF9F6',
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box
        sx={{
          overflow: 'auto',
          pt: 4,
          px: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ overflow: 'hidden' }}>
          <Box sx={{ width: '100%', mb: 2 }}>
            {isSidebarOpen ? (
              <TextField
                id="sidebar-search"
                placeholder="Search"
                size="small"
                sx={[{ width: '100%' }, isSidebarOpen ? { mr: 3 } : { mr: 'auto' }]}
                slotProps={{
                  input: {
                    sx: { pl: 1.5 },
                    startAdornment: <Icon baseClassName="material-symbols-outlined">search</Icon>,
                  },
                  htmlInput: {
                    sx: {
                      pl: 1.5,
                      '&::placeholder': {
                        opacity: 1,
                      },
                    },
                  },
                }}
              />
            ) : (
              <IconButton sx={{ ml: 0.5 }} aria-label="search" onClick={openSidebar}>
                <Icon sx={{ color: '#0F150C' }} baseClassName="material-symbols-outlined">
                  search
                </Icon>
              </IconButton>
            )}
          </Box>
          <List>
            {navigation.map((item) => (
              <ListItem
                component={NavLink}
                key={item.name}
                to={item.to}
                sx={{
                  borderRadius: 1,
                  '&.active': {
                    backgroundColor: '#d4f5f6ff',
                  },
                }}
                disablePadding
              >
                <ListItemButton
                  disabled={item.disabled}
                  sx={{ px: 1.5 }}
                // TouchRippleProps does not accept 'sx', so it is removed to fix the type error
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon sx={{ color: '#0F150C' }} baseClassName="material-symbols-outlined">
                      {item.icon}
                    </Icon>
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                  <Typography
                    sx={{
                      backgroundColor: '#27D0C7',
                      borderRadius: '100px',
                      fontSize: '12px',
                      px: '6px',
                      fontWeight: 500,
                      lineHeight: '20px',
                    }}
                  >
                    <code>{item.count}</code>
                  </Typography>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        {isSidebarOpen && (
          <Box sx={{ mt: 'auto', overflow: 'hidden' }}>
            <List>
              {footer.map((item) => (
                <ListItem
                  component={Link}
                  key={item.name}
                  to={item.to}
                  target="_blank"
                  disablePadding
                >
                  <ListItemButton sx={{ px: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Icon sx={{ color: '#0F150C' }} baseClassName="material-symbols-outlined">
                        {item.icon}
                      </Icon>
                    </ListItemIcon>
                    <ListItemText primary={item.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};
