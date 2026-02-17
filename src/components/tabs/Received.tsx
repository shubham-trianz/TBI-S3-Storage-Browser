// import { list } from 'aws-amplify/storage';
import { useEffect, useState, useMemo } from 'react';
// import { fetchAuthSession } from 'aws-amplify/auth';
import {
  Flex,
  Heading,
  Divider,
} from "@aws-amplify/ui-react";
import { UploadButton } from "../utils/UploadButton";
import Breadcrumbs from "../utils/Breadcrumbs"
import { useReceivedCases } from '../../hooks/cases';
import { useUser } from '../../context/UserContext';
import { useListS3Objects } from '../../hooks/lists3objects';
import { useCaseEvidence } from '../../hooks/useCaseEvidence';

import CasesGrid from '../utils/CaseTable';
import { CreateFolder } from '../utils/CreateFolder';


export const Received = () => {
    const { user_name } = useUser()

  

  // const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);


  const {data: receivedCases, isLoading: casesLoading} = useReceivedCases(user_name)
  console.log('receivedCases: ', receivedCases)
  const cases = receivedCases?.cases;


  const [files, setFiles] = useState<any[]>([]);
  const [baseKey, setBaseKey] = useState<string | null>(null); // case root
  const [activeCase, setActiveCase] = useState<null | {
    caseNumber: string;
    canWrite: boolean;
  }>(null);
  const isInsideCase = activeCase !== null;
  // const [loading, setLoading] = useState(true);
  // const [identityId, setIdentityId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const currentPath = pathStack.join('');
  
  const currentCaseNumber = pathStack.length > 0 ? pathStack[0].replace('/', '') : null;
  
  const {
    data: evidenceData,
    isLoading: isEvidenceLoading,
    isFetching: isEvidenceFetching,
    refetch: refetchEvidence,
  } = useCaseEvidence(currentCaseNumber ?? '');

  const evidenceByKey = useMemo(() => {
    const map = new Map<string, any>();
    evidenceData?.items?.forEach(ev => {
      map.set(ev.s3_key, ev);
      
      const filename = ev.s3_key?.split('/').pop();
      if (filename) {
        map.set(filename, ev);
      }
    });
    return map;
  }, [evidenceData]);

  


  const normalizedBaseKey = baseKey
  ? baseKey.endsWith('/')
    ? baseKey
    : `${baseKey}/`
  : null;
  const currentPrefix = normalizedBaseKey
  ? `${normalizedBaseKey}${pathStack.length ? pathStack.join('')  : ''}`
  : null;

  const { data: receivedFiles} = useListS3Objects(currentPrefix);
  console.log('objectssssssssssssssssssssss: ', receivedFiles)
  // useEffect(() => setFiles(objects), [currentPrefix])
  console.log('currentPath: ', currentPath)
  // const currentFolderPrefix = identityId ? `private/${identityId}/${currentPath}` : null;
  // const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  // const isRoot = pathStack.length === 0;
  const isRoot = baseKey === null;
  const viewMode = isRoot ? "received" : "files";

  // const isFilesRoot = baseKey !== null && pathStack.length === 0;

  // const selectedFiles = [...selected].filter(p => !p.endsWith("/"));
  // const selectedFolders = [...selected].filter(p => p.endsWith("/"));
  // const selectAllRef = useRef<HTMLInputElement>(null);
  // const [searchField, setSearchField] = useState<SearchField>('case_number');
  // const [evidenceSearchField, setEvidenceSearchField] = useState<EvidenceSearchField>('name');
  // const [searchValue, setSearchValue] = useState('');
  // const { data: cases, isLoading } = useCases();
  // console.log('cases: ', cases)
  

  
  
  // type SearchField = 'case_number' | 'case_title' | 'case_agents';
  // type EvidenceSearchField = 'name' | 'evidence_number' | 'description';

  // const SEARCH_FIELDS: { key: SearchField; label: string }[] = [
  //   { key: 'case_number', label: 'Case Number' },
  //   { key: 'case_title', label: 'Case Title' },
  //   { key: 'case_agents', label: 'Case Agent' }
  // ];

  // const EVIDENCE_SEARCH_FIELDS: { key: EvidenceSearchField; label: string }[] = [
  //   { key: 'name', label: 'File Name' },
  //   { key: 'evidence_number', label: 'Evidence Number' },
  //   { key: 'description', label: 'Description' }
  // ];

  // type SortKey = 'case_number' | 'case_title' | 'case_agents' | 'size';
  // type SortOrder = 'asc' | 'desc';

  // const [sortKey, setSortKey] = useState<SortKey>('case_number');
  // const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  
  // const filteredCases = useMemo(() => {
  //   if (!cases || !Array.isArray(cases)) return [];
  //   if (!searchValue.trim()) return cases;

  //   const q = searchValue.toLowerCase();

  //   return cases?.filter(item =>
  //     String(item[searchField] ?? '')
  //       .toLowerCase()
  //       .includes(q)
  //   );
  // }, [cases, searchField, searchValue]);


//   const sortedCases = useMemo(() => {
//   const sorted = [...filteredCases].sort((a, b) => {
    
//     if (sortKey === 'size') {
//       const aSize = typeof a.size === 'number' ? a.size : 0;
//       const bSize = typeof b.size === 'number' ? b.size : 0;
//       return aSize - bSize;
//     }

//     const aVal = String(a[sortKey] ?? '');
//     const bVal = String(b[sortKey] ?? '');

//     // string sort
//     return String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, {
//       sensitivity: 'base',
//       numeric: true
//     });
//   });

//   return sortOrder === 'asc' ? sorted : sorted.reverse();
// }, [filteredCases, sortKey, sortOrder]);

// const handleSort = (key: SortKey) => {
//   if (sortKey === key) {
//     setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
//   } else {
//     setSortKey(key);
//     setSortOrder('asc');
//   }
// };

// File sorting and filtering with evidence metadata
// type FileSortKey = 'name' | 'evidence_number' | 'description' | 'uploaded';
// const [fileSortKey, setFileSortKey] = useState<FileSortKey>('name');
// const [fileSortOrder, setFileSortOrder] = useState<SortOrder>('asc');

// const filteredFiles = useMemo(() => {
//   if (!searchValue.trim() || isRoot) return files;

//   const q = searchValue.toLowerCase();

//   return files.filter(item => {
//     const name = item.path.split('/').filter(Boolean).pop() || '';
//     const evidence = evidenceByKey.get(item.path) || evidenceByKey.get(name);

//     switch (evidenceSearchField) {
//       case 'name':
//         return name.toLowerCase().includes(q);
      
//       case 'evidence_number':
//         return evidence?.evidence_number?.toLowerCase().includes(q) || false;
      
//       case 'description':
//         return evidence?.description?.toLowerCase().includes(q) || false;
      
//       default:
//         return false;
//     }
//   });
// }, [files, searchValue, evidenceSearchField, evidenceByKey, isRoot]);

// const sortedFiles = useMemo(() => {
//   const sorted = [...filteredFiles].sort((a, b) => {
//     const aName = a.path.split('/').filter(Boolean).pop() || '';
//     const bName = b.path.split('/').filter(Boolean).pop() || '';
    
//     // Folders always come first
//     const aIsFolder = a.path.endsWith('/');
//     const bIsFolder = b.path.endsWith('/');
//     if (aIsFolder !== bIsFolder) {
//       return aIsFolder ? -1 : 1;
//     }

//     // Get evidence data for sorting
//     const aEvidence = evidenceByKey.get(a.path) || evidenceByKey.get(aName);
//     const bEvidence = evidenceByKey.get(b.path) || evidenceByKey.get(bName);

//     let result = 0;

//     switch (fileSortKey) {
//       case 'name': {
//         result = aName.localeCompare(bName, undefined, { 
//           sensitivity: 'base',
//           numeric: true 
//         });
//         break;
//       }
      
//       case 'evidence_number': {
//         const aEvidenceNum = aEvidence?.evidence_number || '';
//         const bEvidenceNum = bEvidence?.evidence_number || '';
//         result = aEvidenceNum.localeCompare(bEvidenceNum, undefined, {
//           sensitivity: 'base',
//           numeric: true
//         });
//         break;
//       }
      
//       case 'description': {
//         const aDesc = aEvidence?.description || '';
//         const bDesc = bEvidence?.description || '';
//         result = aDesc.localeCompare(bDesc, undefined, { sensitivity: 'base' });
//         break;
//       }
      
//       case 'uploaded': {
//         const aTime = aEvidence?.uploaded_at 
//           ? new Date(aEvidence.uploaded_at).getTime() 
//           : 0;
//         const bTime = bEvidence?.uploaded_at 
//           ? new Date(bEvidence.uploaded_at).getTime() 
//           : 0;
//         result = aTime - bTime;
//         break;
//       }
//     }

//     return result;
//   });

//   return fileSortOrder === 'asc' ? sorted : sorted.reverse();
// }, [filteredFiles, fileSortKey, fileSortOrder, evidenceByKey]);

// const handleFileSort = (key: FileSortKey) => {
//   if (fileSortKey === key) {
//     setFileSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
//   } else {
//     setFileSortKey(key);
//     setFileSortOrder('asc');
//   }
// };

// useEffect(() => {
//   setSearchValue('');
// }, [searchField, evidenceSearchField]);
  
  // const rootFolderPrefix = identityId
  // ? `private/${identityId}/`
  // : null;
  // const canGenerateLink =
  //   selectedFiles.length > 0 ||
  //   selectedFolders.length === 1 ||
  //   !!currentFolderPrefix ||
  //   !!rootFolderPrefix;  




  // useEffect(() => {
  //   async function init() {
  //     const session = await fetchAuthSession();
  //     setIdentityId(session.identityId ?? null);
  //   }
  //   init();
  // }, []);

//   const filesList = useMemo(() => {
//   return receivedFiles ?? [];
// }, [receivedFiles]);

  // const loadFiles = useCallback(async () => {
  //     // setLoading(true);
  //     setFiles([])
  //     setFilesLoading(true)
  
  //     try {
  //       console.log('fillllllllllllllllllllll: ', receivedFiles)
  //       const mergedItems = receivedFiles.map((item) => {
          
  //         if (item.type === "folder") {
  //           return item; // folders don't have metadata
  //         }
  
  //         const fullKey = item.Key;
  //         const fileName = fullKey?.split("/").pop();
  
  //         // try full key first (most reliable)
  //         const metadata =
  //           evidenceByKey.get(fullKey) ||
  //           evidenceByKey.get(fileName) ||
  //           null;
  
  //         return {
  //           ...item,
  //           ...metadata, // attach metadata object
  //         };
  //       });
  //       console.log('mergedItemsssssss: ', mergedItems)
  //       setFiles(mergedItems);
  //       // setFiles(getFirstLevelItems(result.items, basePath));
  //     } catch (err) {
  //       console.error('Error listing files', err);
  //     } finally {
  //       // setLoading(false);
  //       setFilesLoading(false);
  //     }
  //   }, [filesList, evidenceByKey,  ]);
  
  //   useEffect(() => {
  //     loadFiles();
  //   }, [loadFiles]);
  
  useEffect(() => {
  if (!receivedFiles) return;

  setFilesLoading(true);

  try {
    console.log('receivedFilessssssssssss: ', receivedFiles)
    const mergedItems = receivedFiles.map((item) => {
      if (item.type === "folder") return item;

      const fullKey = item.Key;
      const fileName = fullKey.split("/").pop() || ''
      const metadata =
        evidenceByKey.get(fullKey) ||
        evidenceByKey.get(fileName) ||
        null;
      console.log('metadataaa: ', metadata)
      return {
        ...item,
        ...metadata,
      };
    });
    console.log('mergedItemssssssssss: ', mergedItems)
    setFiles(mergedItems);
  } catch (err) {
    console.error("Error listing files", err);
  } finally {
    setFilesLoading(false);
  }
}, [receivedFiles, evidenceByKey, currentPath]);
  // console.log('myyyyyyyyyyfiless: ', files)
  // const formatBytes = (bytes?: number) =>
  //   bytes
  //     ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
  //     : '—';

  

  const removeLastPathSegment = (key: string) => {
  if (!key) return key;

  const normalized = key.endsWith('/') ? key.slice(0, -1) : key;
  return normalized.substring(0, normalized.lastIndexOf('/') + 1);
};

function handleRowClick(params: any) {
    const row = params.row
    console.log('rows: ', row)
    // setFiles([]);
    setFilesLoading(true);   
    setActiveCase({
      caseNumber: row.case_number,
      canWrite: row.permissions === "Read / Update"? true: false 
    });

    let name: string;
    if(viewMode === 'received'){
      name = row.case_number
      // setPathStack([`${name}/`]);
      setBaseKey(
          removeLastPathSegment(row.source_key)
        );
        setPathStack([`${row.case_number}/`]);
    }
    else{
      name = row.name
      setPathStack(prev => [...prev, `${name}/`]);
    }
    // setSelected(new Set());
  }

  // useEffect(() => {
    
  //   if(cases && cases?.length > 0){
  //     setCasesLoading(false)
  //   }
  // }, [cases])
  
//   const renderSharedCaseRow = (item: any) => {
//   let name = item.case_number;
//   name = name.replace('CASE#', '')

//   return (
//     <tr
//       key={item.case_number}
//       className="folder"
//       style={{ cursor: 'pointer' }}
//       onClick={() => {
//         setSelected(new Set());
//         setActiveCase({
//           caseNumber: item.case_number.replace('CASE#', ''),
//           canWrite: item.permissions?.write === true, // or however you get this
//         });
        // setBaseKey(
        //   removeLastPathSegment(item.source_key)
        // );

//         // 🔄 reset navigation
//         setPathStack([`${item.case_number.replace('CASE#', '')}`]);
//         // const { data: objects } = useListS3Objects(item.source_key)
//       }}
//     >
//       <td>
//         <input
//           type="checkbox"
//           checked={selected.has(item.source_key)}
//           onClick={e => e.stopPropagation()}
//           onChange={() => toggleSelect(item.source_key)}
//         />
//       </td>

//       <td>📁 {name}</td>

//       <td>{item.case_title}</td>

//       <td>{item.owner_email}</td>

//       <td>
//         {Array.isArray(item.jurisdiction) 
//           ? item.jurisdiction.join(', ') 
//           : item.jurisdiction || '—'}
//       </td>

//       <td>{formatBytes(item.size)}</td>

//       <td>
//         {item.permissions?.write
//           ? 'Read / Write'
//           : 'Read'}
//       </td>

//       <td>
//         {new Date(item.shared_at).toLocaleString()}
//       </td>
//     </tr>
//   );
// };

  // const renderFileRow = (item: any) => {
  //   const name = item.path.split('/').filter(Boolean).pop()!;
  //   const isFolder = item.path.endsWith('/');

  //   const handleView = async (e: React.MouseEvent) => {
  //     e.stopPropagation();
  //     const url = await FileViewDownloadAPI.getSignedUrl(item.path, 'view');
  //     console.log('url: ', url)
  //     window.open(url, '_blank');
  //   };
  
  //   const handleDownload = async (e: React.MouseEvent) => {
  //     e.stopPropagation();
  //     const url = await FileViewDownloadAPI.getSignedUrl(item.path, 'download');
  //     window.location.href = url;
  //   };
  //   // Get evidence metadata
  //   const evidence = evidenceByKey.get(item.path) || evidenceByKey.get(name);

  //   return (
  //     <tr
  //       key={item.path}
  //       className={isFolder ? 'folder' : ''}
  //       style={{ cursor: isFolder ? 'pointer' : 'default' }}
  //       onClick={() =>{
  //         if (!isFolder) return;

  //       // ➕ navigate deeper
  //         setPathStack(prev => [...prev, name]);
  //       }}
  //     >
  //       <td>
  //         <input
  //           type="checkbox"
  //           checked={selected.has(item.path)}
  //           onClick={e => e.stopPropagation()}
  //           onChange={() => toggleSelect(item.path)}
  //         />
  //       </td>
  //       <td>{isFolder ? '📁' : '📄'} {name}</td>
  //       <td>{evidence?.evidence_number || '—'}</td>
  //       <td>{evidence?.description || '—'}</td>
  //       <td>{isFolder ? 'Folder' : 'File'}</td>
  //       <td>{isFolder ? '—' : formatBytes(item.size)}</td>
  //       <td>
  //         {evidence?.uploaded_at 
  //           ? new Date(evidence.uploaded_at).toLocaleString()
  //           : item.lastModified
  //           ? item.lastModified.toLocaleString()
  //           : '—'}
  //       </td>
  //       <td>
  
  //         {!isFolder && (
  //           <>
  //             <div style={{display: 'flex', alignItems: 'center'}}>
  //                 <Tooltip title="View">
  //                   <IconButton onClick={handleView} color="primary">
  //                     <VisibilityIcon />
  //                   </IconButton>
  //                 </Tooltip>
  //                 <Tooltip title="Download">
  //                   <IconButton onClick={handleDownload} color="secondary">
  //                     <DownloadIcon />
  //                   </IconButton>
  //                 </Tooltip>
  //             </div>
  //           </>
  //         )}
  //       </td>
  //     </tr>
  //   );
  // };

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
              <select
                className="search-select"
                value={isRoot ? searchField : evidenceSearchField}
                onChange={e => {
                  if (isRoot) {
                    setSearchField(e.target.value as SearchField);
                  } else {
                    setEvidenceSearchField(e.target.value as EvidenceSearchField);
                  }
                }}
              >
                {(isRoot ? SEARCH_FIELDS : EVIDENCE_SEARCH_FIELDS).map(f => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
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
                disabled={isRoot ? !receivedCases?.cases?.length : !files?.length}
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

          {/* <Button
            size="small"
            variation="primary"
            isLoading={isGeneratingLink}
            loadingText="Generating link..."
            disabled={isGeneratingLink || !canGenerateLink}
            onClick={async () => {
              try {
                setIsGeneratingLink(true);

                // CASE 1: One or more files selected → ZIP only those files
                if (selectedFiles.length > 0) {
                  await generateAndCopyLink({
                    objectKeys: selectedFiles,
                  });
                  return;
                }

                // CASE 2: Folder selected → ZIP that folder
                if (selectedFolders.length === 1) {
                  await generateAndCopyLink({
                    folderPrefix: selectedFolders[0],
                  });
                  return;
                }

                // CASE 3: Inside folder, nothing selected → ZIP current folder
                if (!isRoot && currentFolderPrefix) {
                  await generateAndCopyLink({
                    folderPrefix: currentFolderPrefix,
                  });
                }
              } catch (err) {
                console.error(err);
              } finally {
                setIsGeneratingLink(false);
              }
            }}
          >
            Generate link
          </Button>
           */}
           {isInsideCase && activeCase.canWrite && (
            <CreateFolder
              basePath={`${baseKey}${pathStack.join('')}`}
              receivedTab={true}
              onCreated={() => {
                // loadFiles();
              }}
            />
           )}
            
          {isInsideCase && activeCase.canWrite && (
            <UploadButton
              prefix={`${baseKey}${pathStack.join('')}`}
              onUploaded={async () => {
                // Refetch evidence metadata after upload
                if (currentCaseNumber) {
                  setTimeout(() => {
                    refetchEvidence();
                  }, 500);
                }
              }}
            />
          )}
        </Flex>
      </Flex>

      <Divider />

      
     

      <Breadcrumbs 
        pathStack={pathStack}
        onNavigate={(x: string[]) => {
          // setFiles([]);
          setFilesLoading(true)
          setPathStack(x)
        }}
        onExitCase={() => {
          setActiveCase(null)
          setFiles([]);
          setBaseKey(null);
          setFilesLoading(true)
          setPathStack([]);
      }}/>

      <CasesGrid
        data={viewMode === "received" ? cases || [] : files || []}
        loading={viewMode === "received" ? casesLoading : filesLoading}
        handleRowClick={handleRowClick}
        viewMode={viewMode}
        // handleSelected={(selected: any) => setSelectedRows(selected)}
      />

      

      {!isRoot && pathStack.length === 1 && (isEvidenceLoading || isEvidenceFetching) && (
        <div style={{ padding: '1rem', textAlign: 'center', background: '#f0f0f0' }}>
          Loading evidence metadata...
        </div>
      )}

          
    </>
  );
};

export default Received;