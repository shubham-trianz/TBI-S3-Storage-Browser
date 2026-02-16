// import { useEffect, useState } from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   Autocomplete,
//   TextField,
//   Chip,
//   Box,
//   Checkbox,
//   FormControlLabel,
//   Stack,
//   Typography,
//   Divider,
//   Switch
// } from '@mui/material';

// type User = {
//   user_name: string;
//   email: string;
// };

// type Permission = {
//   read: boolean;
//   write: boolean;
// };

// type SharedUser = User & Permission;

// type ShareMode = 'internal' | 'external';

// type SharePayload = {
//   mode: ShareMode;
//   files: string[];
//   users?: {
//     user_name: string;
//     email: string;
//     read: boolean;
//     write: boolean;
//   }[];
//   externalEmails?: {
//     email: string;
//     read: boolean;
//     write: boolean;
//   }[];
// };

// type SharedTo = {
//   user_id: string;
//   email: string;
//   permissions: {
//     read: boolean;
//     write: boolean;
//   };
// };

// type ShareDialogProps = {
//   open: boolean;
//   users?: User[];
//   selectedFiles: Set<string>;
//   sharedTo?: SharedTo[];
//   onClose: () => void;
//   onShare: (payload: SharePayload) => void;
// };

// export default function ShareDialog({
//   open,
//   users,
//   selectedFiles,
//   sharedTo,
//   onClose,
//   onShare
// }: ShareDialogProps) {
//   const [mode, setMode] = useState<ShareMode>('internal');
//   const [selectedUsers, setSelectedUsers] = useState<SharedUser[]>([]);
//   const [externalEmailsInput, setExternalEmailsInput] = useState('');
//   const isValidEmail = (email: string) =>
//     /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   const parseEmails = (input: string): string[] =>
//   input
//     .split(',')
//     .map(e => e.trim())
//     .filter(e => e.length > 0);

// const externalEmails = parseEmails(externalEmailsInput);

// const invalidEmails = externalEmails.filter(
//   email => !isValidEmail(email)
// );

// const hasInvalidEmails = invalidEmails.length > 0;


//   /* ---------------- Hydrate internal users ---------------- */
//   useEffect(() => {
//     if (!open) return;

//     if (!sharedTo || !users) {
//       setSelectedUsers([]);
//       return;
//     }

//     const hydrated = sharedTo
//       .map(shared => {
//         const user = users.find(u => u.email === shared.email);
//         if (!user) return null;

//         return {
//           user_name: user.user_name,
//           email: shared.email,
//           read: shared.permissions.read,
//           write: shared.permissions.write
//         };
//       })
//       .filter(Boolean) as SharedUser[];

//     setSelectedUsers(hydrated);
//   }, [open, sharedTo, users]);

//   /* ---------------- Internal user change ---------------- */
//   const handleUserChange = (_: any, users: User[]) => {
//     setSelectedUsers(prev => {
//       const map = new Map(prev.map(u => [u.user_name, u]));

//       return users.map(user => {
//         const existing = map.get(user.user_name);
//         return (
//           existing ?? {
//             ...user,
//             read: true,
//             write: false
//           }
//         );
//       });
//     });
//   };

//   const updatePermission = (
//     userId: string,
//     permission: keyof Permission,
//     value: boolean
//   ) => {
//     setSelectedUsers(prev =>
//       prev.map(u =>
//         u.user_name === userId ? { ...u, [permission]: value } : u
//       )
//     );
//   };

//   /* ---------------- Handle Share ---------------- */
//   const handleShare = () => {
//     const base = {
//       mode,
//       files: Array.from(selectedFiles)
//     };

//     if (mode === 'internal') {
//       if (selectedUsers.length === 0) return;

//       onShare({
//         ...base,
//         users: selectedUsers.map(({ user_name, read, write, email }) => ({
//           user_name,
//           email,
//           read,
//           write
//         }))
//       });
//     } else {
//       if (externalEmails.length === 0 || hasInvalidEmails) return;

//       onShare({
//         ...base,
//         externalEmails: externalEmails.map(email => ({
//           email,
//           read: true,
//           write: false
//         }))
//       });
//     }

//     // ✅ Reset state (moved OUTSIDE conditional)
//     setSelectedUsers([]);
//     setExternalEmailsInput('');
//     setMode('internal');
//     onClose();
//   };


//   const handleClose = () => {
//     setSelectedUsers([]);
//     setExternalEmailsInput('');
//     setMode('internal');
//     onClose();
//   };

//   return (
//     <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
//       <DialogTitle>Share Evidence</DialogTitle>

//       <DialogContent>

//         {/* -------- Share Mode Switch -------- */}
//         <Box
//           display="flex"
//           alignItems="center"
//           justifyContent="space-between"
//           mb={2}
//         >
//           <Typography variant="subtitle2">Share Type</Typography>
//           <Stack direction="row" alignItems="center">
//             <Typography>Internal</Typography>
//             <Switch
//               checked={mode === 'external'}
//               onChange={() =>
//                 setMode(prev =>
//                   prev === 'internal' ? 'external' : 'internal'
//                 )
//               }
//             />
//             <Typography>External</Typography>
//           </Stack>
//         </Box>

//         <Divider />

//         {/* -------- Internal Mode -------- */}
//         {mode === 'internal' ? (
//           <>
//             <Autocomplete
//               multiple
//               options={users || []}
//               isOptionEqualToValue={(opt, val) =>
//                 opt.user_name === val.user_name
//               }
//               getOptionLabel={(o) => `${o.email}`}
//               value={selectedUsers}
//               onChange={handleUserChange}
//               renderTags={(value, getTagProps) =>
//                 value.map((option, index) => (
//                   <Chip
//                     label={option.email}
//                     {...getTagProps({ index })}
//                     key={option.user_name}
//                   />
//                 ))
//               }
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label="Select internal users"
//                   margin="normal"
//                 />
//               )}
//             />

//             {selectedUsers.length > 0 && (
//               <Box mt={2}>
//                 <Typography variant="subtitle2">
//                   Permissions
//                 </Typography>

//                 <Stack spacing={2} mt={1}>
//                   {selectedUsers.map(user => (
//                     <Box key={user.user_name}>
//                       <Stack
//                         direction="row"
//                         alignItems="center"
//                         justifyContent="space-between"
//                       >
//                         <Typography>{user.email}</Typography>

//                         <Stack direction="row">
//                           <FormControlLabel
//                             control={
//                               <Checkbox
//                                 checked={user.read}
//                                 onChange={(e) =>
//                                   updatePermission(
//                                     user.user_name,
//                                     'read',
//                                     e.target.checked
//                                   )
//                                 }
//                               />
//                             }
//                             label="Read"
//                           />

//                           <FormControlLabel
//                             control={
//                               <Checkbox
//                                 checked={user.write}
//                                 onChange={(e) =>
//                                   updatePermission(
//                                     user.user_name,
//                                     'write',
//                                     e.target.checked
//                                   )
//                                 }
//                               />
//                             }
//                             label="Write"
//                           />
//                         </Stack>
//                       </Stack>
//                       <Divider />
//                     </Box>
//                   ))}
//                 </Stack>
//               </Box>
//             )}
//           </>
//         ) : (
//           /* -------- External Mode -------- */
//           <Box mt={2}>
//             <Autocomplete
//               multiple
//               freeSolo
//               options={[]} // no predefined options
//               value={externalEmails}
//               onChange={(_, newValue) => {
//                 const cleaned = newValue.map(v => v.trim()).filter(Boolean);
//                 setExternalEmailsInput(cleaned.join(','));
//               }}
//               renderTags={(value, getTagProps) =>
//                 value.map((option, index) => (
//                   <Chip
//                     label={option}
//                     color={isValidEmail(option) ? 'default' : 'error'}
//                     {...getTagProps({ index })}
//                     key={option}
//                   />
//                 ))
//               }
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label="External Emails"
//                   placeholder="Type email and press comma"
//                   error={hasInvalidEmails}
//                   helperText={
//                     hasInvalidEmails
//                       ? `Invalid: ${invalidEmails.join(', ')}`
//                       : 'Press comma or enter to add email'
//                   }
//                   margin="normal"
//                 />
//               )}
//             />
//           </Box>
//         )}
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={handleClose} color="inherit">
//           Cancel
//         </Button>

//         <Button
//           onClick={handleShare}
//           variant="contained"
//           disabled={
//             mode === 'internal'
//               ? selectedUsers.length === 0
//               : externalEmails.length === 0 || hasInvalidEmails
//           }
//         >
//           Share
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }


// -------------------------------------------------------
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Chip,
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
  Divider,
  Switch
} from '@mui/material';

type User = {
  user_name: string;
  email: string;
};

type Permission = {
  read: boolean;
  write: boolean;
};

type SharedUser = User & Permission;

type ShareMode = 'internal' | 'external';

type SharePayload = {
  mode: ShareMode;
  files: string[];
  users?: {
    user_name: string;
    email: string;
    read: boolean;
    write: boolean;
  }[];
  externalEmails?: {
    email: string;
    read: boolean;
    write: boolean;
  }[];
};

type SharedTo = {
  user_id: string;
  email: string;
  permissions: {
    read: boolean;
    write: boolean;
  };
};

type ShareDialogProps = {
  open: boolean;
  users?: User[];
  selectedFiles: Set<string>;
  sharedTo?: SharedTo[];
  onClose: () => void;
  onShare: (payload: SharePayload) => void;
};

export default function ShareDialog({
  open,
  users,
  selectedFiles,
  sharedTo,
  onClose,
  onShare
}: ShareDialogProps) {
  const [mode, setMode] = useState<ShareMode>('internal');
  const [selectedUsers, setSelectedUsers] = useState<SharedUser[]>([]);
  const [externalEmailsInput, setExternalEmailsInput] = useState('');
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const parseEmails = (input: string): string[] =>
  input
    .split(',')
    .map(e => e.trim())
    .filter(e => e.length > 0);

const externalEmails = parseEmails(externalEmailsInput);

const invalidEmails = externalEmails.filter(
  email => !isValidEmail(email)
);

const hasInvalidEmails = invalidEmails.length > 0;


  /* ---------------- Hydrate internal users ---------------- */
  useEffect(() => {
    if (!open) return;

    if (!sharedTo || !users) {
      setSelectedUsers([]);
      return;
    }

    const hydrated = sharedTo
      .map(shared => {
        const user = users.find(u => u.email === shared.email);
        if (!user) return null;

        return {
          user_name: user.user_name,
          email: shared.email,
          read: shared.permissions.read,
          write: shared.permissions.write
        };
      })
      .filter(Boolean) as SharedUser[];

    setSelectedUsers(hydrated);
  }, [open, sharedTo, users]);

  /* ---------------- Internal user change ---------------- */
  const handleUserChange = (_: any, users: User[]) => {
    setSelectedUsers(prev => {
      const map = new Map(prev.map(u => [u.user_name, u]));

      return users.map(user => {
        const existing = map.get(user.user_name);
        return (
          existing ?? {
            ...user,
            read: true,
            write: false
          }
        );
      });
    });
  };

  const updatePermission = (
    userId: string,
    permission: keyof Permission,
    value: boolean
  ) => {
    setSelectedUsers(prev =>
      prev.map(u =>
        u.user_name === userId ? { ...u, [permission]: value } : u
      )
    );
  };

  /* ---------------- Handle Share ---------------- */
  const handleShare = () => {
    const base = {
      mode,
      files: Array.from(selectedFiles)
    };

    if (mode === 'internal') {
      if (selectedUsers.length === 0) return;

      onShare({
        ...base,
        users: selectedUsers.map(({ user_name, read, write, email }) => ({
          user_name,
          email,
          read,
          write
        }))
      });
    } else {
      if (externalEmails.length === 0 || hasInvalidEmails) return;

      onShare({
        ...base,
        externalEmails: externalEmails.map(email => ({
          email,
          read: true,
          write: false
        }))
      });
    }

    // ✅ Reset state (moved OUTSIDE conditional)
    setSelectedUsers([]);
    setExternalEmailsInput('');
    setMode('internal');
    onClose();
  };


  const handleClose = () => {
    setSelectedUsers([]);
    setExternalEmailsInput('');
    setMode('internal');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Evidence</DialogTitle>

      <DialogContent>

        {/* -------- Share Mode Switch -------- */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="subtitle2">Share Type</Typography>
          <Stack direction="row" alignItems="center">
            <Typography>Internal</Typography>
            <Switch
              checked={mode === 'external'}
              onChange={() =>
                setMode(prev =>
                  prev === 'internal' ? 'external' : 'internal'
                )
              }
            />
            <Typography>External</Typography>
          </Stack>
        </Box>

        <Divider />

        {/* -------- Internal Mode -------- */}
        {mode === 'internal' ? (
          <>
            <Autocomplete
              multiple
              options={users || []}
              isOptionEqualToValue={(opt, val) =>
                opt.user_name === val.user_name
              }
              getOptionLabel={(o) => `${o.email}`}
              value={selectedUsers}
              onChange={handleUserChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.email}
                    {...getTagProps({ index })}
                    key={option.user_name}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select internal users"
                  margin="normal"
                />
              )}
            />

            {selectedUsers.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2">
                  Permissions
                </Typography>

                <Stack spacing={2} mt={1}>
                  {selectedUsers.map(user => (
                    <Box key={user.user_name}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography>{user.email}</Typography>

                        <Stack direction="row">
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={user.read}
                                onChange={(e) =>
                                  updatePermission(
                                    user.user_name,
                                    'read',
                                    e.target.checked
                                  )
                                }
                              />
                            }
                            label="Read"
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={user.write}
                                onChange={(e) =>
                                  updatePermission(
                                    user.user_name,
                                    'write',
                                    e.target.checked
                                  )
                                }
                              />
                            }
                            label="Write"
                          />
                        </Stack>
                      </Stack>
                      <Divider />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </>
        ) : (
          /* -------- External Mode -------- */
          <Box mt={2}>
            <Autocomplete
              multiple
              freeSolo
              options={[]} // no predefined options
              value={externalEmails}
              onChange={(_, newValue) => {
                const cleaned = newValue.map(v => v.trim()).filter(Boolean);
                setExternalEmailsInput(cleaned.join(','));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    color={isValidEmail(option) ? 'default' : 'error'}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="External Emails"
                  placeholder="Type email and press comma"
                  error={hasInvalidEmails}
                  helperText={
                    hasInvalidEmails
                      ? `Invalid: ${invalidEmails.join(', ')}`
                      : 'Press comma or enter to add email'
                  }
                  margin="normal"
                />
              )}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>

        <Button
          onClick={handleShare}
          variant="contained"
          disabled={
            mode === 'internal'
              ? selectedUsers.length === 0
              : externalEmails.length === 0 || hasInvalidEmails
          }
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
}
