import { uploadData } from "aws-amplify/storage";
import { Button } from "@aws-amplify/ui-react";
import { useState } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";
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
type CreateFolderProps = {
  basePath: string;
  onCreated: (payload: any) => void;
  disabled?: boolean;
};

const JURISDICTIONS = [
  ...Array.from({ length: 32 }, (_, i) => `${i + 1}st Judicial District`.replace("1st", i + 1 === 1 ? "1st" : `${i + 1}th`)),
  "East US Attorneys Office",
  "Middle US Attorneys Office",
  "West US Attorneys Office",
];



export const CreateCase = ({
  basePath,
  onCreated,
  disabled,
}: CreateFolderProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [caseNumber, setCaseNumber] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [jurisdiction, setJurisdiction] = useState<string[]>([]);
  const [caseAgents, setCaseAgents] = useState("");
  // const [uploadedBy, setUploadedBy] = useState("");
  // const [username, setUsername] = useState("");
  const { user_name, email } = useUser();
  // useEffect(() => {
  //     async function loadUser() {
  //       const session = await fetchAuthSession();
  //       const username =
  //         session.tokens?.idToken?.payload?.email ??
  //         session.tokens?.idToken?.payload?.["cognito:username"] ??
  //         "";
  //       setUploadedBy(String(username));
  //     }
  //     loadUser();
  //   }, []);
  const validateCaseNumber = (value: string) =>
    /^\d{4}-\d{7}$/.test(value);

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

    const folderPath = `${basePath}${caseNumber}/`;

    try {
      setLoading(true);

      await uploadData({
        path: `${folderPath}${caseNumber}_metadata.json`,
        data: JSON.stringify({created: true}),
        options: {
          metadata: {
            user_name: user_name,
            email: email || '',
            case_number: caseNumber,
            case_title: caseTitle,
            jurisdiction: JSON.stringify(jurisdiction),
            case_agents: caseAgents,
          },
        },
      }).result;
      const payload = {
        user_name: user_name,
        email: email || '',
        case_number: caseNumber,
        case_title: caseTitle,
        jurisdiction: JSON.stringify(jurisdiction),
        case_agents: caseAgents,
        source_key: folderPath
      }

      setOpen(false);
      onCreated(payload);
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
        onClick={() => setOpen(true)}
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
            />

            <TextField
              required
              label="Kaseware Case Title"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
            />

          <TextField
              select
              required
              label="Jurisdiction"
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
            />

            {error && (
              <span style={{ color: "red" }}>{error}</span>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variation="link" onClick={() => setOpen(false)}>
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
