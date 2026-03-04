import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useUser } from '../../context/UserContext';
import Popover from '@mui/material/Popover';


import logo from '../../assets/logo.png'
import FullScreenLoader from '../utils/FullScreenLoader';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState } from 'react';
import { Button, LinearProgress, Stack } from '@mui/material';
import { Pause, PlayArrow } from '@mui/icons-material';
// import { useUser } from '../../context/UserContext';

import {useUploadManager} from '../../context/UploadContext'
// type UploadItem = {
//   id: string;
//   fileName: string;
//   progress: number;
//   status: "uploading" | "paused" | "error" | "completed";
//   pause: () => void;
//   resume: () => void;
//   retry: () => void;
//   cancel: () => void;
// };
type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "paused" | "error" | "completed";
  controller: {
    pause: () => void;
    resume: () => void;
    retry: () => void;
    cancel: () => void;
  };
};

export default function PrimarySearchAppBar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
  const { email, signOut } = useUser()

  const isMenuOpen = Boolean(anchorEl);
  const isCheckDownloadStatusOpen = Boolean(anchorEl2)

  // const [uploads, setUploads] = useState<UploadItem[]>([]);
  const { uploads } = useUploadManager();
  console.log('upppppp: ', uploads)

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    console.log('event.currentTarget: ', event.currentTarget)
    setAnchorEl(event.currentTarget);
  };

  const handleUploadClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl2(event.currentTarget)
  }

  // {uploads.map(upload => (
                  
  //       <Box key={upload.id}>
  //         <Typography>{upload.file.size}</Typography>

  //         <LinearProgress
  //           variant="determinate"
  //           value={upload.progress}
  //         />

  //         <Stack direction="row">
  //           {upload.status === "paused" ? (
  //             <IconButton onClick={upload.controller.resume}>
  //               <PlayArrow />
  //             </IconButton>
  //           ) : (
  //             <IconButton onClick={upload.controller.pause}>
  //               <Pause />
  //             </IconButton>
  //           )}

  //           {upload.status === "error" && (
  //             <Button onClick={upload.controller.retry}>
  //               Retry
  //             </Button>
  //           )}
  //         </Stack>
  //       </Box>
  //     ))}

  const handleUploadClose = () => {
    setAnchorEl2(null);
  }

  const renderDownloads = (
    <Popover
      id={'id'}
      open={isCheckDownloadStatusOpen}
      anchorEl={anchorEl2}
      onClose={handleUploadClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      {/* <Typography sx={{ p: 2 }}>The content of the Popover.</Typography> */}
      <Box sx={{minWidth: 400, maxHeight: 600, p: 1}}>
        {[...uploads].slice().reverse().map(upload => (
                    
          <Box 
            key={upload.id}
            sx={{
              p: 2,
              m: 1, 
              borderRadius: 3,
              backgroundColor: "#fafafa",
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              "&:hover": {
                boxShadow: "0 4px 18px rgba(0,0,0,0.1)"
              }
            }} 
          >
            
            <Typography sx={{fontWeight: 500, mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{upload.file.name}</Typography>

            <Box flex={1} sx={{display: 'flex', flexDirection: 'column'}}>
            {<LinearProgress
              color={upload.status === 'completed'?'success': 'primary'}
              variant="determinate"
              value={upload.status === 'completed' ? 100: upload.progress}
              sx={{
                height: 8,
                borderRadius: 5,
                mb: 1.5
              }}
            />}

            <Stack sx={{display: 'flex', justifyContent: 'space-between'}} direction="row">
              <Box>
              {upload.status !== 'completed' && (<Typography  fontSize={20} variant="caption">
                  {/* {isPaused ? "Paused" : `${progress}% uploaded`} */}
                  {upload.isPaused || upload.status === 'error'
                    ? "Paused"
                    : `${upload.progress}% uploaded`}
                </Typography>)}
              

              {upload.status === 'completed' && (
                <Box sx={{ display: 'flex', alignContent: 'center', marginTop: 1}}>
                  Upload Successful
                  <CheckCircleIcon style={{color: 'green'}} /> 
                </Box>
              )}
              </Box>
              <Box>
              {upload.status === "error" && (
                <Button
                  size='small'
                  variant='outlined'
                  color='error'
                onClick={upload.controller.retry}>
                  Retry
                </Button>
              )}
              {upload.status !== 'completed' && upload.status !== 'error' && (upload.isPaused ? (  
                <IconButton onClick={upload.controller.resume}>
                  <PlayArrow />
                </IconButton>
              ) : (
                <IconButton onClick={upload.controller.pause}>
                  <Pause />
                </IconButton>
              ))}
              </Box>
            </Stack>
            {/* <Box sx={{display: 'flex', flexDirection: 'row', backgroundColor: 'green'}}> */}
              <Typography 
                sx={{
                  fontFamily: 'monospace', 
                  color: 'text.secondary',
                  letterSpacing: '0.5px', 
                  // opacity: 0.65, 
                  fontSize: 12,
                  
                  alignSelf: 'flex-end'
                }}>
                {upload.prefix.split('/').splice(2).join('/')}
              </Typography>
            {/* </Box> */}
            </Box>
            {/* <Divider/> */}
          </Box>
          
          
        ))}

      </Box>
    </Popover>
  )

  
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
        vertical: 'bottom',
        horizontal: 'left',
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
              onClick={
               
                handleUploadClick
                
              }
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
      {renderDownloads}
      {signingOut && <FullScreenLoader text="Signing out..." />}
    </Box>
  );
}
