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

export const Received = () => {
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
  const [searchValue, setSearchValue] = useState('');
  // const { data: cases, isLoading } = useCases();
  // console.log('cases: ', cases)
  const {data: receivedCases} = useReceivedCases(user_name)
  console.log('receivedCases: ', receivedCases)
  type SearchField = 'case_number' | 'case_title' | 'case_agents';

  const SEARCH_FIELDS: { key: SearchField; label: string }[] = [
    { key: 'case_number', label: 'Case Number' },
    { key: 'case_title', label: 'Case Title' },
    { key: 'case_agents', label: 'Case Agent' }
  ];

  type SortKey = 'case_number' | 'case_title' | 'case_agents' | 'size';
  type SortOrder = 'asc' | 'desc';

  const [sortKey, setSortKey] = useState<SortKey>('case_number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  
  const filteredCases = useMemo(() => {
    if (!cases) return [];
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

useEffect(() => {
  setSearchValue('');
}, [searchField]);
  
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
          type: 'file'
        });
        continue;
      }

      const folderName = parts[0];
      const folderPath = basePath + folderName + '/';

      if (!map.has(folderPath)) {
        map.set(folderPath, {
          path: folderPath,
          type: 'folder'
        });
      }

     
    }
    console.log('map: ', map)
    return Array.from(map.values());
  }
  useEffect(() => {
      setCases([{
      case_number: '2019-0000001',
      case_title: 'Homicide',
      jurisdiction: JSON.stringify(["3rd Jurisdiction","6th Jurisdiction","5th Jurisdiction"]),
      case_agents: 'Shubham',
      email: 'shubhamparashar65000@gmail.com',
      user_name: 'e40844f8-9021-70cd-f017-4671f72ca39e',
      size: 0  
    }])
  }, [])
  const keys = [
    {path: "private/us-east-1:b36012c8-c4d0-cca5-4d73-f877d27e3339/2019-0000001/evidence/sub_evidence/demo 2.mp4"},
    {path: "private/us-east-1:b36012c8-c4d0-cca5-4d73-f877d27e3339/2019-0000001/avatar.mp4"}
  ]

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

  // const CasesTableHeader = () => (
  //   <thead>
  //     <tr>
  //       <th>
  //         {/* <input
  //           ref={selectAllRef}
  //           type="checkbox"
  //           checked={cases?.length > 0 && selected.size === cases?.length}
  //           onChange={toggleSelectAll}
  //         /> */}
  //       </th>
  //       {/* <th>Case Number</th> */}
  //       <th onClick={() => handleSort('case_number')} style={{ cursor: 'pointer' }}>
  //         Case Number <SortIcon active={sortKey === 'case_number'} />
  //       </th>
  //       {/* <th>Case Title</th> */}
  //       <th onClick={() => handleSort('case_title')} style={{ cursor: 'pointer' }}>
  //         Case Title <SortIcon active={sortKey === 'case_title'} />
  //       </th>
  //       {/* <th>Case Agent</th> */}
  //       <th onClick={() => handleSort('case_agents')} style={{ cursor: 'pointer' }}>
  //         Case Agent <SortIcon active={sortKey === 'case_agents'} />
  //       </th>
  //       <th>Jurisdiction</th>
  //       {/* <th>Size</th> */}
  //       <th onClick={() => handleSort('size')} style={{ cursor: 'pointer' }}>
  //         Size <SortIcon active={sortKey === 'size'} />
  //       </th>

  //     </tr>
  //   </thead>
  // );
  
  const SharedCasesTableHeader = () => (
  <thead>
    <tr>
      <th></th>

      <th onClick={() => handleSort('case_number')} style={{ cursor: 'pointer' }}>
        Case Number <SortIcon active={sortKey === 'case_number'} />
      </th>

      <th onClick={() => handleSort('case_title')} style={{ cursor: 'pointer' }}>
        Case Title <SortIcon active={sortKey === 'case_title'} />
      </th>

      <th>Shared By</th>

      <th>Jurisdiction</th>

      <th onClick={() => handleSort('size')} style={{ cursor: 'pointer' }}>
        Size <SortIcon active={sortKey === 'size'} />
      </th>

      <th>Access</th>

      {/* <th onClick={() => handleSort('shared_at')} style={{ cursor: 'pointer' }}> */}
      <th  style={{ cursor: 'pointer' }}>
        Shared On 
        {/* <SortIcon active={sortKey === 'shared_at'} /> */}
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
        <th>Name</th>
        
      <th>Type</th>
      <th>Size</th>
      <th>Last Modified</th>
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

      <td>{item.jurisdiction?.join(', ')}</td>

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
        <td>{isFolder ? 'Folder' : 'File'}</td>
        <td>{isFolder ? '—' : formatBytes(item.size)}</td>
        <td>
          {item.lastModified
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
                value={searchField}
                onChange={e => setSearchField(e.target.value as SearchField)}
              >
                {SEARCH_FIELDS.map(f => (
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
                  SEARCH_FIELDS.find(f => f.key === searchField)?.label
                }`}
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                disabled={!cases?.length}
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
              // onUploadComplete={loadFiles}
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
          {!isRoot && files.map(renderFileRow)}
        </tbody>
      </table>
    </>
  );
};