import { list } from 'aws-amplify/storage';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  Flex,
  Heading,
  // Divider,
  Button,
} from "@aws-amplify/ui-react";
import { UploadButton } from "../utils/UploadButton";
import { DeleteObjects } from "../utils/DeleteObjects";
import { CreateCase } from '../utils/CreateCase';
import { CreateFolder } from '../utils/CreateFolder';
// import { generateAndCopyLink } from "../utils/generateLink";
import Breadcrumbs from "../utils/Breadcrumbs"
import { useCases, useShareCaseTo } from '../../hooks/cases';
// import ShareDialog from '../utils/ShareDialog';
// import { useCases } from '../../hooks/cases';
import { useCaseEvidence } from '../../hooks/useCaseEvidence';

import CasesGrid from '../utils/CaseTable';

import ShareDialog from '../utils/ShareDialog';
import { useUser } from '../../context/UserContext';
import { useCognitoUser } from '../../hooks/users';
// import { IconButton, Tooltip } from '@mui/material';
import toast from 'react-hot-toast';

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";




export const Personal = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);

  const { user_name, email } = useUser()

  const createS3Client = async () => {
    const session = await fetchAuthSession();

    if (!session.credentials) {
      throw new Error("No AWS credentials found");
    }

    return new S3Client({
      region: "us-east-1",
      credentials: session.credentials
    });
  };
  
    const currentPath = pathStack.join('');
  // console.log('currentPath: ', currentPath)
  const currentCaseNumber =
  pathStack.length > 0 ? pathStack[0].replace('/', '') : null;

 const {
  data: evidenceData,
  isLoading: isEvidenceLoading,
  isFetching: isEvidenceFetching, // This shows when refetching
  refetch: refetchEvidence,
} = useCaseEvidence(currentCaseNumber ?? '');
  // console.log('evidenceDataaaaaa: ', evidenceData)
  const currentFolderPrefix = identityId ? `private/${identityId}/${currentPath}` : null;
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const isRoot = pathStack.length === 0;
  const viewMode = isRoot ? "cases" : "files";

  const selectedFiles = [...selected].filter(p => !p.endsWith("/"));
  const selectedFolders = [...selected].filter(p => p.endsWith("/"));
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [searchField, setSearchField] = useState<SearchField>('case_number');
  const [evidenceSearchField, setEvidenceSearchField] = useState<EvidenceSearchField>('name');
  const [searchValue, setSearchValue] = useState('');
  const { data: cases, isLoading } = useCases();
  const { mutate: shareCaseTo } = useShareCaseTo();

  const s3Ref = useRef<any>(null);
  useEffect(() => {
    createS3Client().then(client => {
        s3Ref.current = client
    })
  }, []);

  useEffect(() => {
    
    if(cases && cases?.length > 0){
      setCasesLoading(false)
    }
  }, [cases])

  // useEffect(() => {
    
  //   if(files && files?.length > 0){
  //     console.log('files changeddddd')
  //     setFilesLoading(false)
  //   }
  // }, [files])
  
  const { data: cognitoUsers,  } = useCognitoUser()
  const filteredUsers = cognitoUsers?.filter(item => item.email != email)
  
  // const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  // console.log('cases: ', cases)
  const evidenceByKey = useMemo(() => {
  const map = new Map<string, any>();
  evidenceData?.items?.forEach(ev => {
    // Try both full s3_key and just the filename
    map.set(ev.s3_key, ev);
    
    // Also try mapping by the filename only
    const filename = ev.s3_key?.split('/').pop();
    if (filename) {
      map.set(filename, ev);
    }
  });
  return map;
}, [evidenceData]);


  const rootFolderPrefix = identityId
  ? `private/${identityId}/`
  : null;
  const canGenerateLink =
    selectedFiles.length > 0 ||
    selectedFolders.length === 1 ||
    !!currentFolderPrefix ||
    !!rootFolderPrefix;  

  /* ------------------ AUTH INIT ------------------ */
  useEffect(() => {
    async function init() {
      const session = await fetchAuthSession();
      setIdentityId(session.identityId ?? null);
    }
    init();
  }, []);

 
  const loadFiles = useCallback(async () => {
    if (!identityId) return;

    // setLoading(true);
    setFiles([])
    setFilesLoading(true)
    // setFiles([]);
    // setSelected(new Set());

    try {
      const items = []
      const basePath = `private/${identityId}/${currentPath}`;
      // console.log('base path: ', basePath)
      // const result = await list({ path: basePath });
      // console.log('resultttt: ', result)
      const command = new ListObjectsV2Command({
        Bucket: 'amplify-d1dgn0zrt9tb32-mai-mystoragebucket472d5355-sb6ffkrqvk1q',
        Prefix: basePath,
        Delimiter: '/'
      });
      // const s3 = await createS3Client();
      const response = await s3Ref.current.send(command);
     

      for(const item of response.CommonPrefixes || []){
        items.push({
          Key: item.Prefix,
          type: "folder"
        })
      }

      for(const item of response.Contents || []){
        // console.log('itemmmmmm: ', item)
        if(item.Key == basePath) continue
        items.push(item)
      }
      console.log('itemsssssssss: ', items)
      const mergedItems = items.map((item) => {
        if (item.type === "folder") {
          return item; // folders don't have metadata
        }

        const fullKey = item.Key;
        const fileName = fullKey?.split("/").pop();

        // try full key first (most reliable)
        const metadata =
          evidenceByKey.get(fullKey) ||
          evidenceByKey.get(fileName) ||
          null;

        return {
          ...item,
          ...metadata, // attach metadata object
        };
      });
      console.log('mergedItemsssssss: ', mergedItems)
      setFiles(mergedItems);
      // setFiles(getFirstLevelItems(result.items, basePath));
    } catch (err) {
      console.error('Error listing files', err);
    } finally {
      // setLoading(false);
      setFilesLoading(false);
    }
  }, [identityId, currentPath, evidenceByKey  ]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);
  
  function handleRowClick(params: any) {
    const row = params.row
    setFiles([]);
    setFilesLoading(true);   
     

    let name: string;
    if(viewMode === 'cases'){
      name = row.case_number
      setPathStack([`${name}/`]);
    }
    else{
      name = row.name
      setPathStack(prev => [...prev, `${name}/`]);
    }
    setSelected(new Set());
  }

  // console.log('selectedRows: ', selectedRows)

  const [open, setOpen] = useState(false)
  const users = filteredUsers

  const extractCaseNumber = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 2]; // "2026-0000003"
  };

  useEffect(() => {
  if (viewMode === "files") {
    setFiles([]); // clear only when switching modes
    setFilesLoading(true)
  }
}, [viewMode]);


  return (
    <>

      <Flex
        justifyContent="space-between"
        alignItems="center"
        padding="0.75rem 0"
      >
        <Heading level={5}>Files</Heading>

        <Flex gap="0.5rem">

          {/* <div className="search-bar">
            <div className="search-select-wrapper">
              {isRoot ? (
                <select
                  className="search-select"
                  value={searchField}
                  onChange={e => setSearchField(e.target.value as SearchField)}
                >
                  {SEARCH_FIELDS.map(f => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  className="search-select"
                  value={evidenceSearchField}
                  onChange={e => setEvidenceSearchField(e.target.value as EvidenceSearchField)}
                >
                  {EVIDENCE_SEARCH_FIELDS.map(f => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              )}
              <span className="select-arrow">▼</span>
            </div>

            <div className="search-input-wrapper">
              <input
                className="search-input"
                type="text"
                placeholder={`Search by ${
                  isRoot
                    ? SEARCH_FIELDS.find(f => f.key === searchField)?.label
                    : EVIDENCE_SEARCH_FIELDS.find(f => f.key === evidenceSearchField)?.label
                }`}
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                disabled={isRoot ? !cases?.length : !files?.length}
              />

              {searchValue && (
                <button
                  className="clear-btn"
                  onClick={() => setSearchValue('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div> */}

          {isRoot && (
            <Button size='small' onClick={() => setOpen(true)} disabled={selectedRows.length === 0}>
              Share
            </Button>
          )}
          {open && (
            <ShareDialog
              open={open}
              users={users}
              selectedFiles={selectedRows}
              sharedTo={
                selectedRows.length === 1
                  ? cases?.find(
                      c => c.case_number === extractCaseNumber([...selectedRows][0])
                    )?.shared_to
                  : []
              }
              onClose={() => setOpen(false)}
              onShare={async (selected) => {
              const now = new Date().toISOString();
              const items = [];

              const selectedUsers = selected.users;
              const selectedFiles = selected.files;
              // console.log('selectedUsers: ', selectedUsers)
              for (const file of selectedFiles) {
                const caseNumber = extractCaseNumber(file);

                // 🔑 get metadata from your case list
                const caseMeta = cases?.find(
                  c => c.case_number === caseNumber
                );

                if (!caseMeta) continue; // safety

                for (const user of selectedUsers) {
                  items.push({
                    receiver_user_id: `RECEIVER#${user.user_name}`,
                    case_number: `CASE#${caseNumber}`,

                    // GSI for owner-side queries
                    gsi1pk: `OWNER#${user_name}`,
                    gsi1sk: `CASE#${caseNumber}#RECEIVER#${user.user_name}`,

                    // Identifiers
                    receiver_user: user.user_name,
                    receiver_email: user.email,
                    owner_user: user_name,
                    
                    // case_number: caseNumber,

                    // 📦 copied metadata
                    case_title: caseMeta.case_title,
                    jurisdiction: caseMeta.jurisdiction,
                    case_agents: caseMeta.case_agents,
                    size: caseMeta.size ?? 0,
                    source_key: caseMeta.source_key,
                    owner_email: caseMeta.email,

                    // Permissions
                    permissions: {
                      read: user.read,
                      write: user.write
                    },

                    shared_at: now
                  });
                }
              }

              // console.log('Shared case items:', items);
              await shareCaseTo(items);
              // console.log('closing dialog')
              setOpen(false)
              toast.success('Success')
              // queryClient.invalidateQueries({ queryKey: ['cases'] })
            }}

            />
          )}

          {/* <input
            type="text"
            placeholder="Search by case number, title, agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          /> */}
          {/* <Button
            size="small"
            onClick={loadFiles}
            isLoading={loading}
          >
            Refresh
          </Button> */}

          {isRoot && (<Button
            size="small"
            variation="primary"
            isLoading={isGeneratingLink}
            loadingText="Generating link..."
            disabled={isGeneratingLink || !canGenerateLink}
            onClick={async () => {
              try {
                // setIsGeneratingLink(true);
                // console.log('selectedFilesssssssssssssssssss: ', selected)
                // const case_number = selected
                 const selectedArray = Array.from(selectedRows);

                    if (!selectedArray.length) return;

                    const fullPath = selectedArray[0];

                    // Remove trailing slash
                    const trimmedPath = fullPath.replace(/\/$/, "");

                    // Split by "/"
                    const parts = trimmedPath.split("/");

                    // Case number is last segment
                    const case_number = parts[parts.length - 1];

                    // console.log("Extracted case number:", case_number);

                    const link = `${window.location.origin}/access/${case_number}`;

                    await navigator.clipboard.writeText(link);

                    toast.success("Link copied to clipboard!");

                // CASE 1: One or more files selected → ZIP only those files
                // if (selectedFiles.length > 0) {
                //   await generateAndCopyLink({
                //     objectKeys: selectedFiles,
                //   });
                //   return;
                // }
                // if (selectedEvidence.length > 0) {
                //   await generateAndCopyLink({
                //     objectKeys: selectedEvidence,
                //   });
                //   return;
                // }

                // CASE 2: Folder selected → ZIP that folder
                // if (selectedFolders.length === 1) {
                //   await generateAndCopyLink({
                //     folderPrefix: selectedFolders[0],
                //   });
                //   return;
                // }

                // CASE 3: Inside folder, nothing selected → ZIP current folder
                // if (!isRoot && currentFolderPrefix) {
                //   await generateAndCopyLink({
                //     folderPrefix: currentFolderPrefix,
                //   });
                // }
              } catch (err) {
                console.error(err);
              } finally {
                setIsGeneratingLink(false);
              }
            }}
          >
            Generate link
          </Button>
          )}


          {isRoot ? (
            <CreateCase
              basePath={`private/${identityId}/${currentPath}`}
            />
            )
            :(
              <CreateFolder
              basePath={`private/${identityId}/${currentPath}`}
              onCreated={() => {
                loadFiles();
              }}
              disabled={loading || !identityId}
              // onDuplicateError={showNotification}
              // folderExists={folderExists}
              // refreshFiles={loadFiles}
            />
            )
        }
          <DeleteObjects
            selectedPaths={[...selected]}
            onDeleted={loadFiles}
          />

          {identityId && !isRoot && (
          <UploadButton
            prefix={`private/${identityId}/${currentPath}`}
            onUploaded={async () => {
              await loadFiles();
              if (currentCaseNumber) {
                setTimeout(() => {
                  refetchEvidence();
                },);
              }
            }}
          />
        )}
        </Flex>
      </Flex>
      <Breadcrumbs 
        pathStack={pathStack}
        onNavigate={(x: string[]) => {
          setFiles([]);
          setFilesLoading(true)
          setPathStack(x)
        }}
        onExitCase={() => {
          setFiles([]);
          setFilesLoading(true)
          setPathStack([]);
      }}
      />

      <CasesGrid
        data={viewMode === "cases" ? cases || [] : files || []}
        loading={viewMode === "cases" ? casesLoading : filesLoading}
        handleRowClick={handleRowClick}
        viewMode={viewMode}
        handleSelected={(selected: any) => setSelectedRows(selected)}
      />
      
      {/* <CasesGrid 
        data={cases || []}
        loading={cases}
        handleRowClick={handleRowClick}
        viewMode="cases"
      />
      <CasesGrid
        data={files || []}
        loading={files}
        handleRowClick={handleRowClick}
        viewMode="files"
      /> */}
        {/* {isRoot && (
          <table className="storage-table">
          {isRoot ? <CasesTableHeader /> : <FilesTableHeader />}

            <tbody>
              {!isLoading && sortedCases.map(renderCaseRow)}
            </tbody>
          </table>
        )}

        {!isRoot && pathStack.length === 1 && (
          <>
            {(isEvidenceLoading || isEvidenceFetching) && (
              <div style={{ padding: '1rem', textAlign: 'center', background: '#f0f0f0' }}>
                Loading evidence metadata...
              </div>
            )}
            <table className="storage-table">
              <FilesTableHeader />
              <tbody>
                {!loading && files.map(f)}
              </tbody>
            </table>
          </>
        )}
        {!isRoot && pathStack.length > 1 && (
          <table className="storage-table">
            <FilesTableHeader />
            <tbody>
              {!loading && files.map(renderFileRow)}
            </tbody>
          </table>
        )} */}
    </>
  );
};