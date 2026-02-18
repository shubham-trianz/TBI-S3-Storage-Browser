import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, IconButton, Tooltip } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
// import InsertDriveFileIcon from "@mui/icons-material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { FileViewDownloadAPI } from "../../api/viewdownload";


import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useMemo, useState } from "react";

import {
  Case,
  ShareCaseToPayload,
} from "../../api/cases/cases.types";

export interface S3BaseObject {
  Key: string;
  type?: "folder"; // only present for folders
}


interface S3File extends S3BaseObject {
  type?: undefined; // files don't have "folder"

  LastModified: string;
  ETag: string;
  ChecksumAlgorithm?: string[];
  ChecksumType?: string;
  Size: number;
  StorageClass: string;

  // Evidence metadata
  case_number: string;
  content_type: string;
  evidence_seq: number;
  uploaded_at: string;
  uploaded_by: string;
  description?: string;

  PK: string;
  SK: string;
  source_key: string;
  evidence_number: string;
}


interface CommonGridProps {
  loading: boolean;
  handleRowClick: (params: unknown) => void;
  handleSelected?: (params: unknown) => void;
  onFileDrop?: (file: File) => void;
}

interface CasesModeProps extends CommonGridProps {
  viewMode: "cases";
  data: Case[];
}

interface FilesModeProps extends CommonGridProps {
  viewMode: "files";
  data: S3File[];
}

interface ReceivedModeProps extends CommonGridProps {
  viewMode: "received";
  data: ShareCaseToPayload[];
}

type GridProps =
  | CasesModeProps
  | FilesModeProps
  | ReceivedModeProps;

export default function CasesGrid(props: GridProps) {
   const { viewMode, data, loading, handleRowClick, handleSelected, onFileDrop } = props;

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (viewMode !== "files") return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (viewMode !== "files") return;

    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileDrop?.(files[0]);
    }
  };


  const caseColumns: GridColDef[] = [
    {
      field: "case_number",
      headerName: "Case Number",
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: 'pointer'
            
          }}
        >
          <FolderIcon
            sx={{
              fontSize: 20,
              color: "#f59e0b",
            }}
          />
          {params.value}
        </Box>
      ),
    },
    {
      field: "case_title",
      headerName: "Case Title",
      flex: 1,
    },
    {
      field: "case_agents",
      headerName: "Case Agent",
      flex: 1,
    },
    {
      field: "jurisdiction",
      headerName: "Jurisdiction",
      flex: 1,
    },
    {
      field: "size",
      headerName: "Size",
      flex: 1,
      valueFormatter: (params) =>
        formatBytes(params),
    },
  ];

  const fileColumns: GridColDef[] = [
  {
    field: "name",
    headerName: "Name",
    flex: 1,
    renderCell: (params) => {
      const isFolder = params.row.isFolder;

      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0,  width: "100%", cursor: 'pointer'}}>
          {isFolder ? (
            <FolderIcon sx={{ fontSize: 20, color: "#f59e0b" }} />
          ) : (
            <InsertDriveFileIcon sx={{ fontSize: 20, color: "#64748b" }} />
          )}
          <Box
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0, // 🔥 critical
          flexGrow: 1,
        }}
      >
        {params.value}
      </Box>
        </Box>
      );
    },
  },
  {
    field: "evidence_number",
    headerName: "Evidence",
    flex: 1,
  },
  {
    field: "description",
    headerName: "Description",
    flex: 1,
  },
  {
    field: "uploaded",
    headerName: "Uploaded",
    flex: 1,
  },
  {
    field: "size",
    headerName: "Size",
    flex: 1,
    valueFormatter: (params) =>
      formatBytes(params),
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 130,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => {
      const isFolder = params.row.isFolder;
      const id = params.row.id
      const handleView = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = await FileViewDownloadAPI.getSignedUrl(id, 'view');
        console.log('url: ', url)
        window.open(url, '_blank');
      };

      const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = await FileViewDownloadAPI.getSignedUrl(id, 'download');
        window.location.href = url;
      };

      return (
        <>
            {!isFolder && (
              <Tooltip title="View">
                <IconButton size="small" onClick={handleView}>
                  <VisibilityIcon fontSize="small" color="primary"/>
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Download">
              <IconButton size="small" onClick={handleDownload}>
                <DownloadIcon fontSize="small" color="secondary"/>
              </IconButton>
            </Tooltip>
        </>
      );
    },
  },
];

const receivedCaseColumns: GridColDef[] = [
  {
    field: "case_number",
    headerName: "Case Number",
    flex: 1,
    renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: 'pointer'
            
          }}
        >
          <FolderIcon
            sx={{
              fontSize: 20,
              color: "#f59e0b", 
            }}
          />
          {params.value}
        </Box>
      ),
  },
  {
    field: "case_title",
    headerName: "Case Title",
    flex: 1,
  },
  {
    field: "jurisdiction",
    headerName: "Jurisdiction",
    flex: 1,
  },
  {
    field: "case_agents",
    headerName: "Assigned Agent",
    flex: 1,
  },
  {
    field: "owner_email",
    headerName: "Shared By",
    flex: 1,
  },
  {
    field: "permissions",
    headerName: "Access",
    flex: 1,
  },
  {
    field: "size",
    headerName: "Size",
    flex: 1,
    valueFormatter: (params) =>
      formatBytes(params),
  },
  {
    field: "shared_at",
    headerName: "Shared At",
    flex: 1,
  },
];


function formatBytes(bytes?: number) {
    if (!bytes) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }


  const rows = useMemo(() => {
  if (viewMode === "cases") {

    return data.map((item) => ({
      id: item.source_key,
      case_number: item.case_number,
      case_title: item.case_title,
      case_agents: item.case_agents,
      jurisdiction: Array.isArray(item.jurisdiction)
        ? item.jurisdiction.join(", ")
        : item.jurisdiction,
      size: item.size,
    }));
  }

  if (viewMode === "received") {
    return data.map((item) => {
      const { read, write } = item.permissions || {};

      let access = "No Access";
      if (read && write) access = "Read / Update";
      else if (read) access = "Read Only";

      return {
        id: item.case_number,
        case_number: item.case_number.replace("CASE#", ""),
        case_title: item.case_title,
        case_agents: item.case_agents,
        jurisdiction: Array.isArray(item.jurisdiction)
          ? item.jurisdiction.join(", ")
          : item.jurisdiction,
        owner_email: item.owner_email,
        permissions: access,
        size: item.size,
        shared_at: new Date(item.shared_at).toLocaleString(),
        source_key: item.source_key,
      };
    });
  }

  return data.map((item) => {
    const name = item.Key?.split("/").filter(Boolean).pop() || "";
    return {
      id: item.Key,
      name,
      isFolder: item.Key?.endsWith("/"),
      evidence_number: item.evidence_number || "—",
      description: item.description || "—",
      uploaded: item.uploaded_at
        ? new Date(item.uploaded_at).toLocaleString()
        : "—",
      size: item.Size || 0,
    };
  });
}, [data, viewMode]);


const columns = useMemo(() => {
  if (viewMode === "cases") return caseColumns;
  if (viewMode === "received") return receivedCaseColumns;
  return fileColumns;
}, [viewMode]);


  return (
    <Box 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
        sx={{ 
            height: 520, 
            width: "100%", 
            bbackgroundColor: isDragging ? "#f0f8ff" : "#fff",
            borderRadius: 2,
            border: isDragging ? "2px dashed #1976d2" : "2px solid transparent",
            transition: "0.2s ease",
        }}>
      <DataGrid
      key={viewMode}
        loading = {loading}
        rows={rows}
        columns={columns}
        onRowClick={
          (params) => {
            if(viewMode === 'files' && !params.row?.isFolder) return;
            handleRowClick(params)
          }
        }
        onRowSelectionModelChange={(model) => {
          let selectedIds: string[] = [];
          if (model.type === 'include') {
            selectedIds = Array.from(model.ids).map(String);;
          } else {
            // Select-all mode
            const excludedIds = model.ids;
            selectedIds = rows.map((row) => row.id).filter(id => !excludedIds.has(id))
          }
          handleSelected?.(selectedIds);
        }}
        disableRowSelectionOnClick
        checkboxSelection
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
          
        }}
        
        slotProps={{
              loadingOverlay: {
              variant: 'skeleton',
              noRowsVariant: 'skeleton',
            },
        }}
        sx={{
            boxShadow: 3,
            borderRadius: 2,
            '& .MuiDataGrid-row:hover': {
            color: 'chocolate',
          },
          "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 600,
              fontSize: '18px'
          },
        }}
      />
    </Box>
  );
}
