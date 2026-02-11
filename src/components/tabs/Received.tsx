import { list } from 'aws-amplify/storage';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  Flex,
  Heading,
  Divider,
  Button,
} from "@aws-amplify/ui-react";
import { UploadButton } from "../utils/UploadButton";
// import { DeleteObjects } from "../utils/DeleteObjects";
// import { CreateCase } from '../utils/CreateCase';
// import { CreateFolder } from '../utils/CreateFolder';
import { generateAndCopyLink } from "../utils/generateLink";
import Breadcrumbs from "../utils/Breadcrumbs"
import { useReceivedCases } from '../../hooks/cases';
import { useUser } from '../../context/UserContext';
import { useListS3Objects } from '../../hooks/lists3objects';
import { useCaseEvidence } from '../../hooks/useCaseEvidence';

// import { useCases 
// } from '../../hooks/cases';
type CaseItem = {
  case_number: string;
  case_title: string;
  jurisdiction: string;
  case_agents: string;
  email: string;
  user_name: string;
  size?: number;
};

const Received = () => {
  // const [files, setFiles] = useState<any[]>([]);
  const [baseKey, setBaseKey] = useState<string | null>(null); // case root
  const [activeCase, setActiveCase] = useState<null | {
    caseNumber: string;
    canWrite: boolean;
  }>(null);
  const isInsideCase = activeCase !== null;
  console.log('isInsideCase: ', isInsideCase)
  console.log('activeCase: ', activeCase)
  const [loading, setLoading] = useState(true);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cases, setCases] = useState<CaseItem[]>([]);
  // const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const currentPath = pathStack.join('');
  
  // Get current case number from pathStack
  const currentCaseNumber = pathStack.length > 0 ? pathStack[0].replace('/', '') : null;
  
  // Fetch evidence metadata for the current case
  const {
    data: evidenceData,
    isLoading: isEvidenceLoading,
    isFetching: isEvidenceFetching,
    refetch: refetchEvidence,
  } = useCaseEvidence(currentCaseNumber ?? '');

  // Create evidence lookup map
  const evidenceByKey = useMemo(() => {
    const map = new Map<string, any>();
    evidenceData?.items?.forEach(ev => {
      // Map by full s3_key
      map.set(ev.s3_key, ev);
      
      // Also map by filename only for easier lookup
      const filename = ev.s3_key?.split('/').pop();
      if (filename) {
        map.set(filename, ev);
      }
    });
    return map;
  }, [evidenceData]);

  console.log('evidenceData: ', evidenceData);
  console.log('evidenceByKey: ', evidenceByKey);

  // const currentPrefix = pathStack[pathStack.length - 1];
  const currentPrefix = baseKey
  ? `${baseKey}${pathStack.length ? pathStack.join('/') + '/' : ''}`
  : null;
  console.log('currentPrefix: ', currentPrefix)
  console.log('pathStack: ', pathStack)
  const { data: files=[]} = useListS3Objects(currentPrefix);
  console.log('objectssssss: ', files)
  // useEffect(() => setFiles(objects), [currentPrefix])
  const { user_name } = useUser()
  console.log('currentPath: ', currentPath)
  const currentFolderPrefix = identityId ? `private/${identityId}/${currentPath}` : null;
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  // const isRoot = pathStack.length === 0;
  const isRoot = baseKey === null;
  // const isFilesRoot = baseKey !== null && pathStack.length === 0;

  const selectedFiles = [...selected].filter(p => !p.endsWith("/"));
  const selectedFolders = [...selected].filter(p => p.endsWith("/"));
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [searchField, setSearchField] = useState<SearchField>('case_number');
  const [evidenceSearchField, setEvidenceSearchField] = useState<EvidenceSearchField>('name');
  const [searchValue, setSearchValue] = useState('');
  // const { data: cases, isLoading } = useCases();
  // console.log('cases: ', cases)
  const {data: receivedCases} = useReceivedCases(user_name)
  console.log('receivedCases: ', receivedCases)
  
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

// File sorting and filtering with evidence metadata
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
      case 'name':
        result = aName.localeCompare(bName, undefined, { 
          sensitivity: 'base',
          numeric: true 
        });
        break;
      
      case 'evidence_number':
        const aEvidenceNum = aEvidence?.evidence_number || '';
        const bEvidenceNum = bEvidence?.evidence_number || '';
        result = aEvidenceNum.localeCompare(bEvidenceNum, undefined, {
          sensitivity: 'base',
          numeric: true
        });
        break;
      
      case 'description':
        const aDesc = aEvidence?.description || '';
        const bDesc = bEvidence?.description || '';
        result = aDesc.localeCompare(bDesc, undefined, { sensitivity: 'base' });
        break;
      
      case 'uploaded':
        const aTime = aEvidence?.uploaded_at 
          ? new Date(aEvidence.uploaded_at).getTime() 
          : 0;
        const bTime = bEvidence?.uploaded_at 
          ? new Date(bEvidence.uploaded_at).getTime() 
          : 0;
        result = aTime - bTime;
        break;
    }

    return result;
  });

  return fileSortOrder === 'asc' ? sorted : sorted.reverse();
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
}, [searchField, evidenceSearchField]);
  
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

    if (!basePath.endsWith('/')) {
      basePath += '/';
    }

    for (const item of items) {

      if (!item.path.startsWith(basePath)) continue;

      // const relative = item.path.replace(basePath, '');
      const relative = item.path.slice(basePath.length);
      console.log('relative: ', relative)
      // const parts = relative.split('/').filter(Boolean);
      const parts = relative.split('/').filter(Boolean);

      console.log('parts: ', parts)
      // if (parts.length === 1 && !item.path.endsWith('/')) {
      //   map.set(item.path, item);
      //   continue;
      // }
      if (parts.length === 1) {
        map.set(item.path, {
          ...item,
          path: item.path
        });
        continue;
      }

      // subfolder name
      const firstPart = parts[0];
      const folderPath = `${basePath}${firstPart}/`;

      if (!map.has(folderPath)) {
        map.set(folderPath, {
          path: folderPath,
          isFolder: true
        });
      }
    }

    return Array.from(map.values());
  }

  // useEffect(() => {
  //   loadFiles();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [identityId, currentPath]);

  const formatBytes = (bytes?: number) =>
    bytes
      ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
      : '—';

  const toggleSelect = (path: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map((f: any) => f.path)));
    }
  };

  const CasesTableHeader = () => (
    <thead>
      <tr>
        <th>
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={cases.length > 0 && selected.size === cases.length}
            onChange={toggleSelectAll}
          />
        </th>
        <th 
          onClick={() => handleSort('case_number')}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Case Number {sortKey === 'case_number' && (sortOrder === 'asc' ? '↑' : '↓')}
        </th>
        <th 
          onClick={() => handleSort('case_title')}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Case Title {sortKey === 'case_title' && (sortOrder === 'asc' ? '↑' : '↓')}
        </th>
        <th 
          onClick={() => handleSort('case_agents')}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Case Agent {sortKey === 'case_agents' && (sortOrder === 'asc' ? '↑' : '↓')}
        </th>
        <th>Jurisdiction</th>
        <th 
          onClick={() => handleSort('size')}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Size {sortKey === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
        </th>
      </tr>
    </thead>
  );

  const SharedCasesTableHeader = () => (
    <thead>
      <tr>
        <th>
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={cases.length > 0 && selected.size === cases.length}
            onChange={toggleSelectAll}
          />
        </th>
        <th>Case Number</th>
        <th>Case Title</th>
        <th>Owner</th>
        <th>Jurisdiction</th>
        <th>Size</th>
        <th>Permission</th>
        <th>Shared At</th>
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
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Name {fileSortKey === 'name' && (fileSortOrder === 'asc' ? '↑' : '↓')}
        </th>
        <th 
          onClick={() => handleFileSort('evidence_number')}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Evidence # {fileSortKey === 'evidence_number' && (fileSortOrder === 'asc' ? '↑' : '↓')}
        </th>
        <th 
          onClick={() => handleFileSort('description')}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Description {fileSortKey === 'description' && (fileSortOrder === 'asc' ? '↑' : '↓')}
        </th>
        <th>Type</th>
        <th>Size</th>
        <th 
          onClick={() => handleFileSort('uploaded')}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Uploaded {fileSortKey === 'uploaded' && (fileSortOrder === 'asc' ? '↑' : '↓')}
        </th>
      </tr>
    </thead>
  );

  const removeLastPathSegment = (key: string) => {
  if (!key) return key;

  const normalized = key.endsWith('/') ? key.slice(0, -1) : key;
  return normalized.substring(0, normalized.lastIndexOf('/') + 1);
};

  
  const renderSharedCaseRow = (item: any) => {
  let name = item.case_number;
  name = name.replace('CASE#', '')

  return (
    <tr
      key={item.case_number}
      className="folder"
      style={{ cursor: 'pointer' }}
      onClick={() => {
        setSelected(new Set());
        setActiveCase({
          caseNumber: item.case_number.replace('CASE#', ''),
          canWrite: item.permissions?.write === true, // or however you get this
        });
        setBaseKey(
          removeLastPathSegment(item.source_key)
        );

        // 🔄 reset navigation
        setPathStack([`${item.case_number.replace('CASE#', '')}`]);
        // const { data: objects } = useListS3Objects(item.source_key)
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

      <td>{item.owner_email}</td>

      <td>
        {Array.isArray(item.jurisdiction) 
          ? item.jurisdiction.join(', ') 
          : item.jurisdiction || '—'}
      </td>

      <td>{formatBytes(item.size)}</td>

      <td>
        {item.permissions?.write
          ? 'Read / Write'
          : 'Read'}
      </td>

      <td>
        {new Date(item.shared_at).toLocaleString()}
      </td>
    </tr>
  );
};

  const renderFileRow = (item: any) => {
    const name = item.path.split('/').filter(Boolean).pop()!;
    const isFolder = item.path.endsWith('/');

    // Get evidence metadata
    const evidence = evidenceByKey.get(item.path) || evidenceByKey.get(name);

    return (
      <tr
        key={item.path}
        className={isFolder ? 'folder' : ''}
        style={{ cursor: isFolder ? 'pointer' : 'default' }}
        onClick={() =>{
          if (!isFolder) return;

        // ➕ navigate deeper
          setPathStack(prev => [...prev, name]);
        }}
      >
        <td>
          <input
            type="checkbox"
            checked={selected.has(item.path)}
            onClick={e => e.stopPropagation()}
            onChange={() => toggleSelect(item.path)}
          />
        </td>
        <td>{isFolder ? '📁' : '📄'} {name}</td>
        <td>{evidence?.evidence_number || '—'}</td>
        <td>{evidence?.description || '—'}</td>
        <td>{isFolder ? 'Folder' : 'File'}</td>
        <td>{isFolder ? '—' : formatBytes(item.size)}</td>
        <td>
          {evidence?.uploaded_at 
            ? new Date(evidence.uploaded_at).toLocaleString()
            : item.lastModified
            ? item.lastModified.toLocaleString()
            : '—'}
        </td>
      </tr>
    );
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

          <Button
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
          
            
          {isInsideCase && activeCase.canWrite && (
            <UploadButton
              prefix={`${baseKey}${pathStack.join('')}/`}
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
        onExitCase={() => {
        setBaseKey(null);
        setPathStack([]);
        setActiveCase(null);
      }}
        pathStack={pathStack}
        onNavigate={(x: string[]) => setPathStack(x)}
      />

      {/* Show loading indicator for evidence metadata */}
      {!isRoot && pathStack.length === 1 && (isEvidenceLoading || isEvidenceFetching) && (
        <div style={{ padding: '1rem', textAlign: 'center', background: '#f0f0f0' }}>
          Loading evidence metadata...
        </div>
      )}

      <table className="storage-table">
        {isRoot ? (
          <SharedCasesTableHeader />
        ) : (
          <FilesTableHeader />
        )}

        <tbody>
          {/* {loading && (
            <tr className="loading-row">
              <td colSpan={5}>Loading…</td>
            </tr>
          )} */}

          {!loading && cases?.length === 0 && (
            <tr className="loading-row">
              <td colSpan={5}>Empty folder</td>
            </tr>
          )}

          {/* {!loading && isRoot && receivedCases?.cases?.map(renderSharedCaseRow)} */}
          {isRoot && receivedCases?.cases?.map(renderSharedCaseRow)}
          {/* {!loading && !isRoot && files.map(renderFileRow)} */}
          {!isRoot && sortedFiles.map(renderFileRow)}
        </tbody>
      </table>
    </>
  );
};

export default Received;