import { uploadData } from "aws-amplify/storage";
import { Button } from "@aws-amplify/ui-react";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  MenuItem,
  Box,
  Chip,
} from "@mui/material";
import { useUser } from "../../context/UserContext";
import { useCreateCase } from "../../hooks/cases";

type CreateCaseProps = {
  basePath: string;
  // onCreated: (payload: any) => void;
  disabled?: boolean;
  onDuplicateError?: (message: string, type: 'error' | 'success') => void;
  folderExists?: (folderName: string) => boolean;
  refreshCases?: () => Promise<any>;
};

const JURISDICTIONS = [
  "1st Jurisdiction",
  "2nd Jurisdiction",
  "3rd Jurisdiction",
  "4th Jurisdiction",
  "5th Jurisdiction",
  "6th Jurisdiction",
  "7th Jurisdiction",
  ];

export const CreateCase = ({
  basePath,
  // onCreated,
  disabled,
  onDuplicateError,
  folderExists,
  refreshCases,
}: CreateCaseProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [caseNumber, setCaseNumber] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [jurisdiction, setJurisdiction] = useState<string[]>([]);
  const [caseAgents, setCaseAgents] = useState("");
  const { user_name,email } = useUser();

  const { mutate: createCase } = useCreateCase();


  const validateCaseNumber = (value: string) =>
    /^\d{4}-\d{7}$/.test(value);

  const handleOpen = () => {
    setCaseNumber("");
    setCaseTitle("");
    setJurisdiction([]);
    setCaseAgents("");
    setError(null);
    setOpen(true);
  };

  const handleCreate = async () => {
    setError(null);

    if (!validateCaseNumber(caseNumber)) {
      setError("Case Number must be in format YYYY-1234567");
      return;
    }

    if (!caseTitle.trim()) {
      setError("Case Title is required");
      return;
    }

    if (jurisdiction.length === 0) {
      setError("At least one Jurisdiction is required");
      return;
    }

    try {
      setLoading(true);

      // Refresh cases from DB BEFORE checking for duplicates
      if (refreshCases) {
        await refreshCases();
      }

      // Now check if case already exists with fresh data
      if (folderExists && folderExists(caseNumber)) {
        const message = `"${caseNumber}" already exists. Try with another name?`;
        setError(message);
        onDuplicateError?.(message, 'error');
        setLoading(false);
        return;
      }

      const folderPath = `${basePath}${caseNumber}/`;

      await uploadData({
        path: `${folderPath}`,
        data: new Blob([]),
        // options: {
        //   metadata: {
        //     user_name: user_name,
        //     user_email: email || '',
        //     case_number: caseNumber,
        //     case_title: caseTitle,
        //     jurisdiction: JSON.stringify(jurisdiction),
        //     case_agents: caseAgents,
        //   },
        // },
      }).result;
      const payload = {
        user_name: user_name,
        email: email || '',
        case_number: caseNumber,
        case_title: caseTitle,
        jurisdiction: JSON.stringify(jurisdiction),
        case_agents: caseAgents,
        source_key: folderPath,
      }

      onDuplicateError?.(`"${caseNumber}" created successfully`, 'success');
      setOpen(false);
      // onCreated(payload);
      console.log('payload: ', payload)
      await createCase(payload);
    } catch (err) {
      console.error("Create case failed", err);
      setError("Failed to create Case Evidence Repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        onClick={handleOpen}
        isDisabled={disabled}
      >
        Create Case
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Case Evidence Repository</DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              required
              label="Kaseware Case Number"
              placeholder="2025-1234567"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              disabled={loading}
            />

            <TextField
              required
              label="Kaseware Case Title"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              disabled={loading}
            />

            <TextField
              select
              required
              label="Jurisdiction"
              disabled={loading}
              SelectProps={{
                multiple: true,
                renderValue: (selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                ),
                MenuProps: {
                  PaperProps: {
                    style: { maxHeight: 240, width: 320 },
                  },
                  anchorOrigin: { vertical: "bottom", horizontal: "left" },
                  transformOrigin: { vertical: "top", horizontal: "left" },
                },
              }}
              value={jurisdiction}
              onChange={(e) =>
                setJurisdiction(
                  typeof e.target.value === "string"
                    ? e.target.value.split(",")
                    : e.target.value
                )
              }
            >
              {JURISDICTIONS.map((j) => (
                <MenuItem key={j} value={j}>
                  {j}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Case Agent(s)"
              placeholder="Agent Smith, Agent Doe"
              value={caseAgents}
              onChange={(e) => setCaseAgents(e.target.value)}
              disabled={loading}
            />

            {error && (
              <span style={{ color: "red" }}>{error}</span>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variation="link" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variation="primary"
            onClick={handleCreate}
            isDisabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};