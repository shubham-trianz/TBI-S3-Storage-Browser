import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, IconButton, Tooltip } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
// import InsertDriveFileIcon from "@mui/icons-material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { FileViewDownloadAPI } from "../../api/viewdownload";


import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useMemo } from "react";




interface CaseRow {
  id: string;
  case_number: string;
  case_title: string;
  case_agents: string;
  jurisdiction: string;
  size: number;
}

export default function CasesGrid({ data, loading, handleRowClick, viewMode, handleSelected }) {
    // const [loading, setLoading] = useState(true);

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
              color: "#f59e0b", // modern amber folder color
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
          {/* <div style={{alignItems: 'center', justifyContent: 'center', gap:"8px"}}> */}
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
          {/* </div> */}
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
              color: "#f59e0b", // modern amber folder color
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
    // renderCell: (params: any) => {
    //   const { read, write } = params.row?.permissions || {};
    //   if (read && write) return "Read / Write";
    //   if (read) return "Read Only";
    //   return "No Access";
    // },
  },
  {
    field: "size",
    headerName: "Size",
    flex: 1,
    // valueGetter: (params: any) => {
    //   const size = params.row?.size || 0;
    //   if (size === 0) return "0 KB";
    //   return `${(size / 1024).toFixed(2)} KB`;
    // },
  },
  {
    field: "shared_at",
    headerName: "Shared At",
    flex: 1,
  //   valueGetter: (params: any) =>
  //     new Date(params.row?.shared_at).toLocaleString(),
  },
];

// const mapReceivedCasesToRows = (data: any[]) => {
//   return data.map((item) => {
//     const { read, write } = item.permissions || {};

//     let access = "No Access";
//     if (read && write) access = "Read / Write";
//     else if (read) access = "Read Only";

//     return {
//       id: item.case_number, // Required for DataGrid
//       caseNumber: item.case_number,
//       caseTitle: item.case_title,
//       jurisdiction: item.jurisdiction?.join(", ") || "-",
//       assignedAgent: item.case_agents,
//       sharedBy: item.owner_email,
//       access,
//       size:
//         item.size && item.size > 0
//           ? `${(item.size / 1024).toFixed(2)} KB`
//           : "0 KB",
//       sharedAt: new Date(item.shared_at).toLocaleString(),
//       ownerUserId: item.owner_user,
//       receiverUserId: item.receiver_user,
//       sourceKey: item.source_key,
//     };
//   });
// };


function formatBytes(bytes?: number) {
    if (!bytes) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }


  const rows = useMemo(() => {
  if (viewMode === "cases") {

    console.log('dataaooooooo: ', data)
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

  // files mode
  return data.map((item) => {
    const name = item.Key?.split("/").filter(Boolean).pop() || "";
    console.log('nameeeeeeeeeeeeeeeeee: ', item)
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



  // const caseRows: CaseRow[] = data.map((item) => ({
  //   id: item.source_key, // must have unique id
  //   case_number: item.case_number,
  //   case_title: item.case_title,
  //   case_agents: item.case_agents,
  //   jurisdiction: Array.isArray(item.jurisdiction)
  //     ? item.jurisdiction.join(", ")
  //     : item.jurisdiction,
  //   size: item.size,
  // }));

  // const fileRows = data.map((item) => {
  //   const name = item.Key?.split("/").filter(Boolean).pop() || "";

  //   return {
  //       id: item.Key,
  //       name,
  //       isFolder: item.Key?.endsWith("/"),
  //       evidence_number: item.evidence_number || "—",
  //       description: item.description || "—",
  //       uploaded: item.uploaded_at
  //       ? new Date(item.uploaded_at).toLocaleString()
  //       : "—",
  //       size: item.Size || 0,
  //   };
  //   });


//   function handleRowClick(params: any) {
//     console.log('row clicked: ', params)
//   }
// const columns = viewMode === "cases" ? caseColumns : fileColumns;
// const rows = viewMode === "cases" ? caseRows : fileRows;

// const receivedCaseRows = data.map((item) => {
//   const { read, write } = item.permissions || {};
//   console.log('itemsmsmsmsms: ', item)
//   // console.log('itemsmsmsmsms: ', (item.jurisdiction.join(',')))
//   let access = "No Access";
//   if (read && write) access = "Read / Write";
//   else if (read) access = "Read Only";

//   console.log('access: ', access)
//   return {
//     id: item.case_number,
//     case_number: item.case_number.replace("CASE#", ''),
//     case_title: item.case_title,
//     case_agents: item.case_agents,
//     jurisdiction: Array.isArray(item?.jurisdiction)
//       ? item?.jurisdiction.join(", ")
//       : item?.jurisdiction,
//     owner_email: item.owner_email,
//     permissions: access,
//     size: item.size,
//     shared_at: new Date(item.shared_at).toLocaleString(),
//     source_key: item.source_key,
//   };
// });


// const columns =
//   viewMode === "cases"
//     ? caseColumns
//     : viewMode === "received"
//     ? receivedCaseColumns
//     : fileColumns;

const columns = useMemo(() => {
  if (viewMode === "cases") return caseColumns;
  if (viewMode === "received") return receivedCaseColumns;
  return fileColumns;
}, [viewMode]);

// const rows =
//   viewMode === "cases"
//     ? caseRows
//     : viewMode === "received"
//     ? receivedCaseRows
//     : fileRows;



  return (
    <Box 
        sx={{ 
            height: 520, 
            width: "100%", 
            backgroundColor: "#fff",
            borderRadius: 2,

            // boxShadow: "0 4px 20px rgba(0,0,0,0.09)",
            // p: 2,
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
          console.log('modelllll: ', model)
          if (model.type === 'include') {
            selectedIds = Array.from(model.ids);
          } else {
            // Select-all mode
            const excludedIds = model.ids;
            console.log('daaaaaaaaaaaa: ', data)
            selectedIds = data.map((row) => row.source_key).filter(id => !excludedIds.has(id))
          }
          console.log('selectedIdsssssssss: ', selectedIds)
          handleSelected(selectedIds);
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
        // slots={{ noRowsOverlay: "Loading" }}
        sx={{
          boxShadow: 3,
          // border: 1,
          borderRadius: 2,

          // borderColor: 'primary.light',
          '& .MuiDataGrid-row:hover': {
          color: 'chocolate',
    },
            // border: "none", 
        //     "& .MuiDataGrid-columnSeparator": {
        // display: "none",
        // },
        "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
            fontSize: '18px'
        },
           
          
       

        }}
      />
    </Box>
  );
}
