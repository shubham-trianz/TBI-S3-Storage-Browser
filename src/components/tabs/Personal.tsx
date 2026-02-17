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
import { useCases, useShareCaseTo, useShareExternal } from '../../hooks/cases';
// import ShareDialog from '../utils/ShareDialog';
// import { useCases } from '../../hooks/cases';
import { useCaseEvidence } from '../../hooks/useCaseEvidence';
// import { useDeleteEvidence } from '../../hooks/useDeleteEvidence';
import FolderIcon from "@mui/icons-material/Folder";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { FileViewDownloadAPI } from '../../api/viewdownload';


import ShareDialog from '../utils/ShareDialog';
import { useUser } from '../../context/UserContext';
import { useCognitoUser } from '../../hooks/users';
import { IconButton, Tooltip } from '@mui/material';
import toast from 'react-hot-toast';
// import { useQueryClient } from '@tanstack/react-query';
 
// type CaseItem = {
//   case_number: string;
//   case_title: string;
//   jurisdiction: string;
//   case_agents: string;
//   email: string;
//   user_name: string;
//   size?: number;
// };



export const Personal = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // const { mutateAsync: deleteEvidence } = useDeleteEvidence();
  const { mutateAsync: shareExternal } = useShareExternal();
  const { user_name, email } = useUser()

  // const [cases, setCases] = useState<CaseItem[]>([]);
  // const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const currentPath = pathStack.join('');
  console.log('currentPath: ', currentPath)
  const currentCaseNumber =
  pathStack.length > 0 ? pathStack[0].replace('/', '') : null;

 const {
  data: evidenceData,
  isLoading: isEvidenceLoading,
  isFetching: isEvidenceFetching, // This shows when refetching
  refetch: refetchEvidence,
} = useCaseEvidence(currentCaseNumber ?? '');

  const currentFolderPrefix = identityId ? `private/${identityId}/${currentPath}` : null;
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const isRoot = pathStack.length === 0;
  const selectedFiles = [...selected].filter(p => !p.endsWith("/"));
  const selectedFolders = [...selected].filter(p => p.endsWith("/"));
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [searchField, setSearchField] = useState<SearchField>('case_number');
  const [evidenceSearchField, setEvidenceSearchField] = useState<EvidenceSearchField>('name');
  const [searchValue, setSearchValue] = useState('');
  const { data: cases, isLoading } = useCases();
  const { mutate: shareCaseTo } = useShareCaseTo();

  
  const { data: cognitoUsers,  } = useCognitoUser()

  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);


  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!identityId) return;

    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    setDroppedFile(null);

    setTimeout(() => {
      setDroppedFile(files[0]);
    }, 0);
};


  const filteredUsers = cognitoUsers?.filter(item => item.email != email)
  
  // const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  console.log('cases: ', cases)
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

  type SearchField = 'case_number' | 'case_title' | 'case_agents';
  type EvidenceSearchField = 'name' | 'evidence_number' | 'description';

  const SEARCH_FIELDS: { key: SearchField; label: string }[] = [
    { key: 'case_number', label: 'Case Number' },
    { key: 'case_title', label: 'Case Title' },
    { key: 'case_agents', label: 'Case Agent' }
  ];

  const EVIDENCE_SEARCH_FIELDS: { key: EvidenceSearchField; label: string }[] = [
    { key: 'name', label: 'File Name' },
    { key: 'evidence_number', label: 'Evidence Number' },
    { key: 'description', label: 'Description' }
  ];

  type SortKey = 'case_number' | 'case_title' | 'case_agents' | 'size';
  type SortOrder = 'asc' | 'desc';

  const [sortKey, setSortKey] = useState<SortKey>('case_number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredCases = useMemo(() => {
    if (!cases || !Array.isArray(cases)) return [];
    if (!searchValue.trim()) return cases;

    const q = searchValue.toLowerCase();

    return cases?.filter(item =>
      String(item[searchField] ?? '')
        .toLowerCase()
        .includes(q)
    );
  }, [cases, searchField, searchValue]);


  const sortedCases = useMemo(() => {
  const sorted = [...filteredCases].sort((a, b) => {
    
    if (sortKey === 'size') {
      const aSize = typeof a.size === 'number' ? a.size : 0;
      const bSize = typeof b.size === 'number' ? b.size : 0;
      return aSize - bSize;
    }

    const aVal = String(a[sortKey] ?? '');
    const bVal = String(b[sortKey] ?? '');

    // string sort
    return String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, {
      sensitivity: 'base',
      numeric: true
    });
  });

  return sortOrder === 'asc' ? sorted : sorted.reverse();
}, [filteredCases, sortKey, sortOrder]);

const handleSort = (key: SortKey) => {
  if (sortKey === key) {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  } else {
    setSortKey(key);
    setSortOrder('asc');
  }
};

// File sorting and filtering
type FileSortKey = 'name' | 'evidence_number' | 'description' | 'uploaded';
const [fileSortKey, setFileSortKey] = useState<FileSortKey>('name');
const [fileSortOrder, setFileSortOrder] = useState<SortOrder>('asc');

const filteredFiles = useMemo(() => {
  if (!searchValue.trim() || isRoot) return files;

  const q = searchValue.toLowerCase();

  return files.filter(item => {
    const name = item.path.split('/').filter(Boolean).pop() || '';
    const evidence = evidenceByKey.get(item.path) || evidenceByKey.get(name);

    switch (evidenceSearchField) {
      case 'name':
        return name.toLowerCase().includes(q);
      
      case 'evidence_number':
        return evidence?.evidence_number?.toLowerCase().includes(q) || false;
      
      case 'description':
        return evidence?.description?.toLowerCase().includes(q) || false;
      
      default:
        return false;
    }
  });
}, [files, searchValue, evidenceSearchField, evidenceByKey, isRoot]);

const sortedFiles = useMemo(() => {
  const sorted = [...filteredFiles].sort((a, b) => {
    const aName = a.path.split('/').filter(Boolean).pop() || '';
    const bName = b.path.split('/').filter(Boolean).pop() || '';
    
    // Folders always come first
    const aIsFolder = a.path.endsWith('/');
    const bIsFolder = b.path.endsWith('/');
    if (aIsFolder !== bIsFolder) {
      return aIsFolder ? -1 : 1;
    }

    // Get evidence data for sorting
    const aEvidence = evidenceByKey.get(a.path) || evidenceByKey.get(aName);
    const bEvidence = evidenceByKey.get(b.path) || evidenceByKey.get(bName);

    let result = 0;

    switch (fileSortKey) {
      case 'name':{
        result = aName.localeCompare(bName, undefined, { 
          sensitivity: 'base',
          numeric: true 
        });
        break;
      }
      
      case 'evidence_number': {
        const aEvidenceNum = aEvidence?.evidence_number || '';
        const bEvidenceNum = bEvidence?.evidence_number || '';
        result = aEvidenceNum.localeCompare(bEvidenceNum, undefined, {
          sensitivity: 'base',
          numeric: true
        });
        break;
      }
      
      case 'description': {
        const aDesc = aEvidence?.description || '';
        const bDesc = bEvidence?.description || '';
        result = aDesc.localeCompare(bDesc, undefined, { sensitivity: 'base' });
        break;
      }
      
      case 'uploaded': {
        const aTime = aEvidence?.uploaded_at 
          ? new Date(aEvidence.uploaded_at).getTime()
          : a.lastModified?.getTime() || 0;
        const bTime = bEvidence?.uploaded_at
          ? new Date(bEvidence.uploaded_at).getTime()
          : b.lastModified?.getTime() || 0;
        result = aTime - bTime;
        break;
      }
    }

    return fileSortOrder === 'asc' ? result : -result;
  });

  return sorted;
}, [filteredFiles, fileSortKey, fileSortOrder, evidenceByKey]);

const handleFileSort = (key: FileSortKey) => {
  if (fileSortKey === key) {
    setFileSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  } else {
    setFileSortKey(key);
    setFileSortOrder('asc');
  }
};

useEffect(() => {
  setSearchValue('');
}, [searchField, evidenceSearchField, isRoot]);
  
  const rootFolderPrefix = identityId
  ? `private/${identityId}/`
  : null;
  const canGenerateLink =
    selectedFiles.length > 0 ||
    selectedFolders.length === 1 ||
    !!currentFolderPrefix ||
    !!rootFolderPrefix;  

  // const showNotification = (message: string, type: 'error' | 'success' = 'error', duration = 4000) => {
  //   setNotification({ message, type });
  //   setTimeout(() => setNotification(null), duration);
  // };

  // Check if folder/case already exists (refreshed data)
  // const folderExists = (folderName: string): boolean => {
  //   if (isRoot) {
  //     return cases.some(c => c.case_number.toLowerCase() === folderName.toLowerCase());
  //   }
  //   return files.some(f => f.path.toLowerCase() === `${currentPath}${folderName}/`.toLowerCase());
  // };
//   const createCase = useCallback(async (payload: any) => {
//   const session = await fetchAuthSession();
//   const token = session.tokens?.idToken?.toString();

//   const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

//   const res = await fetch(`${apiBaseUrl}/cases`, {
//     method: "PUT",
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });

//   if (!res.ok) {
//     throw new Error(`Request failed: ${res.status}`);
//   }

//   return await res.json();
// }, []);

  // const isSingleFileSelected =
  //   !!selectedFilePath && !selectedFilePath.endsWith("/");

  // const loadCases = useCallback(async () => {
  //   try {
  //     const session = await fetchAuthSession();
  //     const token = session.tokens?.idToken?.toString();

  //     const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  //     console.log('apiBaseUrl: ', apiBaseUrl)
  //     const res = await fetch(
  //       `${apiBaseUrl}/cases`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json"
  //         },
  //         // body: JSON.stringify(caseData)
  //       },
  //     );
  //     if (!res.ok) {
  //       throw new Error(`Request failed: ${res.status}`);
  //     }
    
  //     const response = await res.json();
  //     console.log('response: ', response)
  //     setCases(response)
  //     return response;
  //   } catch (err) {
  //     console.error('Error loading cases:', err);
  //     return [];
  //   }
  // }, [])
  

  // useEffect(() => {
  //   loadCases()
  // }, [loadCases])

  /* ------------------ AUTH INIT ------------------ */
  useEffect(() => {
    async function init() {
      const session = await fetchAuthSession();
      setIdentityId(session.identityId ?? null);
    }
    init();
  }, []);

  function getFirstLevelItems(
    items: any[],
    basePath: string
  ): any[] {
    const map = new Map<string, any>();

    for (const item of items) {
      console.log('item: ', item)
      const relative = item.path.replace(basePath, '');
      console.log('relative: ', relative)
      const parts = relative.split('/').filter(Boolean);
      console.log('parts: ', parts)
      if (parts.length === 1 && !item.path.endsWith('/')) {
        map.set(item.path, item);
        continue;
      }

      if (parts.length >= 1) {
        const folderPath = basePath + parts[0] + '/';
        if (!map.has(folderPath)) {
          map.set(folderPath, {
            path: folderPath,
            eTag: '',
          });
        }
      }
    }
    console.log('map: ', map)
    return Array.from(map.values());
  }
  const loadFiles = useCallback(async () => {
    if (!identityId) return;

    setLoading(true);
    setFiles([]);
    setSelected(new Set());

    try {
      const basePath = `private/${identityId}/${currentPath}`;
      console.log('base path: ', basePath)
      const result = await list({ path: basePath });
      console.log('result: ', result)
      setFiles(getFirstLevelItems(result.items, basePath));
    } catch (err) {
      console.error('Error listing files', err);
    } finally {
      setLoading(false);
    }
  }, [identityId, currentPath]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);
  const toggleSelect = (path: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map(f => f.path)));
    }
  };

  useEffect(() => {
    if (!selectAllRef.current) return;

    selectAllRef.current.indeterminate =
      selected.size > 0 && selected.size < files.length;
  }, [selected, files]);

  function formatBytes(bytes?: number) {
    if (!bytes) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  const SortIcon = ({ active }: { active: boolean }) =>
  active ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : null;

  const CasesTableHeader = () => (
    <thead>
      <tr>
        <th>
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={selected.size === cases?.length && cases?.length > 0}
            onChange={toggleSelectAll}
          />
        </th>
        {/* <th>Case Number</th> */}
        <th onClick={() => handleSort('case_number')} style={{ cursor: 'pointer' }}>
          Case Number <SortIcon active={sortKey === 'case_number'} />
        </th>
        {/* <th>Case Title</th> */}
        <th onClick={() => handleSort('case_title')} style={{ cursor: 'pointer' }}>
          Case Title <SortIcon active={sortKey === 'case_title'} />
        </th>
        {/* <th>Case Agent</th> */}
        <th onClick={() => handleSort('case_agents')} style={{ cursor: 'pointer' }}>
          Case Agent <SortIcon active={sortKey === 'case_agents'} />
        </th>
        <th>Jurisdiction</th>
        {/* <th>Size</th> */}
        <th onClick={() => handleSort('size')} style={{ cursor: 'pointer' }}>
          Size <SortIcon active={sortKey === 'size'} />
        </th>

      </tr>
    </thead>
  );
  

  const FilesTableHeader = () => (
  <thead>
    <tr>
      <th>
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={files.length > 0 && selected.size === files.length}
          onChange={toggleSelectAll}
        />
      </th>
      <th 
        onClick={() => handleFileSort('name')} 
        style={{ cursor: 'pointer' }}
      >
        Name {fileSortKey === 'name' && (fileSortOrder === 'asc' ? ' ▲' : ' ▼')}
      </th>
      <th 
        onClick={() => handleFileSort('evidence_number')} 
        style={{ cursor: 'pointer' }}
      >
        Evidence # {fileSortKey === 'evidence_number' && (fileSortOrder === 'asc' ? ' ▲' : ' ▼')}
      </th>
      <th 
        onClick={() => handleFileSort('description')} 
        style={{ cursor: 'pointer' }}
      >
        Description {fileSortKey === 'description' && (fileSortOrder === 'asc' ? ' ▲' : ' ▼')}
      </th>
      <th 
        onClick={() => handleFileSort('uploaded')} 
        style={{ cursor: 'pointer' }}
      >
        Uploaded / Last Modified {fileSortKey === 'uploaded' && (fileSortOrder === 'asc' ? ' ▲' : ' ▼')}
      </th>
      <th>Size</th>
      <th>Actions</th>
    </tr>
  </thead>
);



  const renderCaseRow = (item: any) => {
    const name = item.case_number;

    return (
      <tr
        key={`${item.user_name}-${item.case_number}`}
        className="folder"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          setSelected(new Set());
          setPathStack([`${name}/`]);
        }}
      >
        <td>
          <input
            type="checkbox"
            checked={selected.has(item.source_key)}
            onClick={e => e.stopPropagation()}
            onChange={() => toggleSelect(item.source_key)}
          />
        </td>
        <td>📁 {name}</td>
        <td>{item.case_title}</td>
        <td>{item.case_agents}</td>
        <td>
          {Array.isArray(item.jurisdiction) 
            ? item.jurisdiction.join(', ') 
            : item.jurisdiction || '—'}
        </td>
        <td>{formatBytes(item.size)}</td>
      </tr>
    );
  };

  const renderFileRow = (item: any) => {
  const name = item.path.split('/').filter(Boolean).pop()!;
  const isFolder = item.path.endsWith('/');

  


  const handleView = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = await FileViewDownloadAPI.getSignedUrl(item.path, 'view');
    console.log('url: ', url)
    window.open(url, '_blank');
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = await FileViewDownloadAPI.getSignedUrl(item.path, 'download');
    window.location.href = url;
  };
  
  // Try to match evidence by full path first, then by filename
  let evidence = evidenceByKey.get(item.path);
  if (!evidence) {
    evidence = evidenceByKey.get(name);
  }

  return (
    <tr
      key={item.path}
      className={isFolder ? 'folder' : ''}
      style={{ cursor: isFolder ? 'pointer' : 'default' }}
      onClick={() =>
        isFolder &&
        setPathStack(prev => [...prev, `${name}/`])
      }
    >
      <td>
        <input
          type="checkbox"
          checked={selected.has(item.path)}
          onClick={e => e.stopPropagation()}
          onChange={() => toggleSelect(item.path)}
        />
      </td>

      <td>{isFolder ? <FolderIcon color="primary" /> : '📄'} {name}</td>

      <td>
        {evidence ? evidence.evidence_number : '—'}
      </td>

      <td>
        {evidence ? evidence.description : '—'}
      </td>

      <td>
        {evidence?.uploaded_at
          ? new Date(evidence.uploaded_at).toLocaleString()
          : item.lastModified
            ? item.lastModified.toLocaleString()
            : '—'}
      </td>

      <td>{formatBytes(item.size)}</td>
      <td>

        {!isFolder && (
          <>
            <div style={{display: 'flex', justifyContent:"center", alignItems:"center", gap:"8px"}}>
                <Tooltip title="View">
                  <IconButton onClick={handleView} color="primary">
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton onClick={handleDownload} color="secondary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
            </div>
          </>
        )}
      </td>
    </tr>
  );
};

  const [open, setOpen] = useState(false)
  const users = filteredUsers

  const extractCaseNumber = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 2]; // "2026-0000003"
  };

  return (
    <>

      <Flex
        justifyContent="space-between"
        alignItems="center"
        padding="0.75rem 0"
      >
        <Heading level={5}>Files</Heading>

        <Flex gap="0.5rem">

          <div className="search-bar">
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
          </div>

          {isRoot && (
            <Button size='small' onClick={() => setOpen(true)} disabled={selected.size === 0}>
              Share
            </Button>
          )}
          {open && (
            <ShareDialog
              open={open}
              users={users}
              selectedFiles={selected}
              sharedTo={
                selected.size === 1
                  ? cases?.find(
                      c => c.case_number === extractCaseNumber([...selected][0])
                    )?.shared_to
                  : []
              }
              onClose={() => setOpen(false)}
              onShare={async (payload) => {
                try {
                  const now = new Date().toISOString();

                  /* =========================
                    INTERNAL SHARING
                  ========================== */
                  if (payload.mode === 'internal' && payload.users) {
                    const items: any[] = [];

                    for (const file of payload.files) {
                      const caseNumber = extractCaseNumber(file);

                      const caseMeta = cases?.find(
                        c => c.case_number === caseNumber
                      );

                      if (!caseMeta) continue;

                      for (const user of payload.users) {
                        items.push({
                          receiver_user_id: `RECEIVER#${user.user_name}`,
                          case_number: `CASE#${caseNumber}`,

                          gsi1pk: `OWNER#${user_name}`,
                          gsi1sk: `CASE#${caseNumber}#RECEIVER#${user.user_name}`,

                          receiver_user: user.user_name,
                          receiver_email: user.email,
                          owner_user: user_name,

                          case_title: caseMeta.case_title,
                          jurisdiction: caseMeta.jurisdiction,
                          case_agents: caseMeta.case_agents,
                          size: caseMeta.size ?? 0,
                          source_key: caseMeta.source_key,
                          owner_email: caseMeta.email,

                          permissions: {
                            read: user.read,
                            write: user.write
                          },

                          shared_at: now
                        });
                      }
                    }

                    // await shareCaseTo(items);
              console.log('Shared case items:', items);
              await shareCaseTo(items);
              console.log('closing dialog')
              setOpen(false)
              toast.success('Success')
                  }

                  /* =========================
                    EXTERNAL SHARING
                  ========================== */
                  if (payload.mode === 'external' && payload.externalEmails) {
                    for (const file of payload.files) {
                      const caseNumber = extractCaseNumber(file);
                      
                      // 📦 Find the case metadata
                      const caseMeta = cases?.find(c => c.case_number === caseNumber);
                      
                      if (!caseMeta) {
                        console.warn(`Case metadata not found for ${caseNumber}`);
                        continue;
                      }

                      // 🔐 Build the wrapped URL on the frontend
                      const frontendUrl = window.location.origin; 
                      const secureViewPath = `/secure-view?prefix=${encodeURIComponent(file)}`;
                      const wrappedUrl = `${frontendUrl}/external-login?redirect=${encodeURIComponent(secureViewPath)}`;

                      for (const ext of payload.externalEmails) {
                        await shareExternal({
                          case_number: caseNumber,
                          file,
                          email: ext.email,
                          wrapped_url: wrappedUrl,
                          
                          // 📦 NEW: Include case metadata
                          case_title: caseMeta.case_title,
                          case_agents: caseMeta.case_agents,
                          jurisdiction: caseMeta.jurisdiction,
                          owner: user_name,
                          owner_email: caseMeta.email,
                          
                          permissions: {
                            read: true,
                            write: false
                          },
                          shared_at: now
                        });
                      }
                    }
                  }
                } catch (err) {
                  console.error("Share failed:", err);
                }
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
          <Button
            size="small"
            onClick={loadFiles}
            isLoading={loading}
          >
            Refresh
          </Button>

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
                 const selectedArray = Array.from(selected);

                    if (!selectedArray.length) return;

                    const fullPath = selectedArray[0];

                    // Remove trailing slash
                    const trimmedPath = fullPath.replace(/\/$/, "");

                    // Split by "/"
                    const parts = trimmedPath.split("/");

                    // Case number is last segment
                    const case_number = parts[parts.length - 1];

                    console.log("Extracted case number:", case_number);

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
          currentCaseNumber={currentCaseNumber}
          onDeleted={loadFiles}
        />
          {identityId && !isRoot && (
          <UploadButton
            prefix={`private/${identityId}/${currentPath}`}
            droppedFile={droppedFile}
            onUploaded={async () => {
              setDroppedFile(null);
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
        onNavigate={(x: string[]) => setPathStack(x)}
        onExitCase={() => {
        setPathStack([]);
      }}
      />
        {/* ================= ROOT = CASE LIST ================= */}
        {isRoot && (
          <table className="storage-table">
          {isRoot ? <CasesTableHeader /> : <FilesTableHeader />}

            <tbody>
              {!isLoading && sortedCases.map(renderCaseRow)}
            </tbody>
          </table>
        )}

        {/* ================= CASE = EVIDENCE + FILES ================= */}
        {!isRoot && pathStack.length === 1 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? "2px dashed #1976d2" : "2px dashed transparent",
              borderRadius: "8px",
              padding: "8px",
              transition: "0.2s",
              minHeight: "400px"
            }}
          >
            {(isEvidenceLoading || isEvidenceFetching) && (
              <div style={{ padding: '1rem', textAlign: 'center', background: '#f0f0f0' }}>
                Loading evidence metadata...
              </div>
            )}
            <table className="storage-table">
              <FilesTableHeader />
              <tbody>
                {!loading && sortedFiles.map(renderFileRow)}
              </tbody>
            </table>
          </div>
        )}
        {/* ================= SUBFOLDER = FILES ONLY ================= */}
        {!isRoot && pathStack.length > 1 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? "2px dashed #1976d2" : "2px dashed transparent",
              borderRadius: "8px",
              padding: "8px",
              transition: "0.2s",
              minHeight: "400px"
            }}
          >
            <table className="storage-table">
              <FilesTableHeader />
              <tbody>
                {!loading && sortedFiles.map(renderFileRow)}
              </tbody>
            </table>
          </div>
        )}
    </>
  );
};