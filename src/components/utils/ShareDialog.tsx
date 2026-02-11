import  { useEffect, useState } from 'react';
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
  Divider
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

type SharePayload = {
  files: string[];
  users: {
    user_name: string;
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
  // const [selectedUsers, setSelectedUsers] = useState<SharedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SharedUser[]>([]);

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

    console.log('selectedFilessss: ', selectedFiles)
  const handleUserChange = (_: any, users: User[]) => {
    setSelectedUsers((prev) => {
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

  const handleShare = () => {

    const payload = {
    files: Array.from(selectedFiles),
    users: selectedUsers.map(({ user_name, read, write, email }) => ({
      user_name,
      email,
      read,
      write
    }))
  };

    onShare(payload);
    setSelectedUsers([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle >Share Evidence</DialogTitle>

      <DialogContent>
        {/* User selector */}
        <Autocomplete
          multiple
          options={users || []}
          isOptionEqualToValue={(opt, val) =>
            opt.user_name === val.user_name
          }
          getOptionLabel={(o) => `(${o.email})`}
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
            <TextField style={{margin: '5px'}} {...params} label="Select users" />
          )}
        />

        {/* Permissions */}
        {selectedUsers.length > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Permissions
            </Typography>

            <Stack spacing={2}>
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
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={selectedUsers.length === 0}
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
}
