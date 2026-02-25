import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useUser } from '../../context/UserContext';

import logo from '../../assets/logo.png'
import FullScreenLoader from '../utils/FullScreenLoader';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
export default function PrimarySearchAppBar() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { email, signOut } = useUser()

  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const menuId = 'primary-search-account-menu';
  const [signingOut, setSigningOut] = React.useState(false);
  const handleSignOut = async () => {
      try {
          if(!signOut){
              console.log('Sign Out is not available')
              return;
          }
          setSigningOut(true);
          await signOut(); 
      } catch (err) {
          console.error("Sign out failed", err);
          setSigningOut(false);
      }
  };
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>{email}</MenuItem>
      <MenuItem
        onClick={() => {
          handleMenuClose()
          handleSignOut()
        }
        }
        disabled={signingOut}
        sx={{ color: 'error.main', justifyContent: 'center',  }}
      >
        Sign out
      </MenuItem>
    </Menu>
  );
  
  return (
    <Box sx={{ flexGrow: 1}}>
      <AppBar position="static" sx={{ backgroundColor: 'hsl(190, 95%, 30%)'}}>
        <Toolbar>
          <Box
            component="img"
            src={logo}
            alt="Company Logo"
            sx={{
              height: {
                xs: 50,   
                sm: 60,     
                lg: 80   
              },       
              padding: 1,
              mr: 2,             
              cursor: 'pointer'
            }}
          />
          <Typography
            variant="h4"
            component="div"
            
            sx={{ 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis', 
              typography: {
                xs: 'h6',
                sm: 'h5',
                md: 'h4'
              }
            }}
          >
            Digital Evidence Management System
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="large"
              color="inherit"
              onClick={() => console.log('Upload clicked')}
              sx={{
                mr: 1,
                width: { xs: 36, sm: 42, md: 48 },
                height: { xs: 36, sm: 42, md: 48 },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: { xs: 25, sm: 27, md: 30 }}} />
            </IconButton>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{
                width: { xs: 36, sm: 42, md: 48 },
                height: { xs: 36, sm: 42, md: 48 },
              }}
            >
              <AccountCircle sx={{ fontSize: { xs: 28, sm: 36, md: 50 } }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMenu}
      {signingOut && <FullScreenLoader text="Signing out..." />}
    </Box>
  );
}
