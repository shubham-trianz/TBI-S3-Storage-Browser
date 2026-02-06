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
import { DeleteObjects } from "../utils/DeleteObjects";
import { CreateCase } from '../utils/CreateCase';
import { CreateFolder } from '../utils/CreateFolder';
import { generateAndCopyLink } from "../utils/generateLink";

type CaseItem = {
  case_number: string;
  case_title: string;
  jurisdiction: string;
  case_agents: string;
  email: string;
  user_name: string;
  size?: number;
};

export const Personal = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cases, setCases] = useState<CaseItem[]>([]);
  // const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const currentPath = pathStack.join('');
  const currentFolderPrefix = identityId ? `private/${identityId}/${currentPath}` : null;
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const isRoot = pathStack.length === 0;
  const selectedFiles = [...selected].filter(p => !p.endsWith("/"));
  const selectedFolders = [...selected].filter(p => p.endsWith("/"));
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [searchField, setSearchField] = useState<SearchField>('case_number');
  const [searchValue, setSearchValue] = useState('');


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

  // const filteredCases = useMemo(() => {
  //   if (!searchTerm.trim()) return cases;

  //   const q = searchTerm.toLowerCase();

  //   return cases.filter(item =>
  //     item.case_number.toLowerCase().includes(q) ||
  //     item.case_title.toLowerCase().includes(q) ||
  //     item.case_agents.toLowerCase().includes(q)
  //   );
  // }, [cases, searchTerm]);

  const filteredCases = useMemo(() => {
    if (!searchValue.trim()) return cases;

    const q = searchValue.toLowerCase();

    return cases.filter(item =>
      String(item[searchField] ?? '')
        .toLowerCase()
        .includes(q)
    );
  }, [cases, searchField, searchValue]);


  const sortedCases = useMemo(() => {
  const sorted = [...filteredCases].sort((a, b) => {
    // const aVal = a[sortKey];
    // const bVal = b[sortKey];

    // numeric sort (size)
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
  // const selectedFilePath =
  //   selected.size === 1 ? [...selected][0] : null;
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
  const createCase = useCallback(async (payload: any) => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const res = await fetch(`${apiBaseUrl}/cases`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return await res.json();
}, []);

  // const isSingleFileSelected =
  //   !!selectedFilePath && !selectedFilePath.endsWith("/");

  const loadCases = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
      console.log('apiBaseUrl: ', apiBaseUrl)
      const res = await fetch(
        `${apiBaseUrl}/cases`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          // body: JSON.stringify(caseData)
        },
      );
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
    
      const response = await res.json();
      console.log('response: ', response)
      setCases(response)
      return response;
    } catch (err) {
      console.error('Error loading cases:', err);
      return [];
    }
  }, [])

  useEffect(() => {
    loadCases()
  }, [loadCases])

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
      const relative = item.path.replace(basePath, '');
      const parts = relative.split('/').filter(Boolean);

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
            checked={cases.length > 0 && selected.size === cases.length}
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
        <th>Name</th>
        
      <th>Type</th>
      <th>Size</th>
      <th>Last Modified</th>
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
        <td>{JSON.parse(item.jurisdiction).join(', ')}</td>
        <td>{formatBytes(item.size)}</td>
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

  


  /* ...existing code... */
  // return (
  //   <>
  //     <Flex
  //       justifyContent="space-between"
  //       alignItems="center"
  //       padding="0.75rem 0"
  //     >
  //       {/* Add this right after your opening Flex */}
  //       {!isRoot && (
  //         <Flex gap="0.5rem" alignItems="center" padding="0.5rem 0">
  //           <Button
  //             size="small"
  //             variation="link"
  //             onClick={() => setPathStack([])}
  //           >
  //             Home
  //           </Button>
  //           {pathStack.map((segment, idx) => (
  //             <Flex key={idx} gap="0.5rem" alignItems="center">
  //               <span>/</span>
  //               <Button
  //                 size="small"
  //                 variation="link"
  //                 onClick={() => setPathStack(pathStack.slice(0, idx + 1))}
  //               >
  //                 {segment.replace('/', '')}
  //               </Button>
  //             </Flex>
  //           ))}
  //         </Flex>
  //       )}
  //       <Heading level={5}>Files</Heading>

  //       <Flex gap="0.5rem">
  //         <Button
  //           size="small"
  //           onClick={loadFiles}
  //           isLoading={loading}
  //         >
  //           Refresh
  //         </Button>

  //         <Button
  //           size="small"
  //           variation="primary"
  //           isLoading={isGeneratingLink}
  //           loadingText="Generating link..."
  //           disabled={isGeneratingLink || !canGenerateLink}
  //           onClick={async () => {
  //             try {
  //               setIsGeneratingLink(true);

  //               // CASE 1: One or more files selected → ZIP only those files
  //               if (selectedFiles.length > 0) {
  //                 await generateAndCopyLink({
  //                   objectKeys: selectedFiles,
  //                 });
  //                 return;
  //               }

  //               // CASE 2: Folder selected → ZIP that folder
  //               if (selectedFolders.length === 1) {
  //                 await generateAndCopyLink({
  //                   folderPrefix: selectedFolders[0],
  //                 });
  //                 return;
  //               }

  //               // CASE 3: Inside folder, nothing selected → ZIP current folder
  //               if (!isRoot && currentFolderPrefix) {
  //                 await generateAndCopyLink({
  //                   folderPrefix: currentFolderPrefix,
  //                 });
  //               }
  //             } catch (err) {
  //               console.error(err);
  //             } finally {
  //               setIsGeneratingLink(false);
  //             }
  //           }}
  //         >
  //           Generate link
  //         </Button>



  //         {isRoot ? (
  //           <CreateCase
  //             basePath={`private/${identityId}/${currentPath}`}
  //             onCreated={async (payload: any) => {
  //               const created = await createCase(payload);
  //               const createdCase = JSON.parse(created['item'])
  //               setCases((prev) => [...prev, createdCase])
  //             }}
  //             disabled={loading || !identityId}
  //           />
  //         ) : (
  //           <CreateFolder
  //             basePath={`private/${identityId}/${currentPath}`}
  //             onCreated={() => {
  //               loadFiles();
  //             }}
  //             disabled={loading || !identityId}
  //           />
  //         )}

  //         <DeleteObjects
  //           selectedPaths={[...selected]}
  //           onDeleted={loadFiles}
  //         />

  //         {identityId && !isRoot && (
  //           <UploadButton
  //             prefix={`private/${identityId}/${currentPath}`}
  //           />
  //         )}
  //       </Flex>
  //     </Flex>

  //     <Divider />

  //     <table className="storage-table">
  //       <thead>
  //         <tr>
  //           <th>
  //             <input
  //               ref={selectAllRef}
  //               type="checkbox"
  //               checked={files.length > 0 && selected.size === files.length}
  //               onChange={toggleSelectAll}
  //             />
  //           </th>
  //           <th>Name</th>
  //           <th>Type</th>
  //           <th>Size</th>
  //           <th>Last Modified</th>
  //         </tr>
  //       </thead>

  //       <tbody>
  //         {loading && (
  //           <tr>
  //             <td colSpan={5}>Loading…</td>
  //           </tr>
  //         )}

  //         {!loading && files.length === 0 && (
  //           <tr>
  //             <td colSpan={5}>Empty folder</td>
  //           </tr>
  //         )}

  //         {!loading && files.map(item => {
  //           const name = item.path.split('/').filter(Boolean).pop();
  //           const isFolder = item.path.endsWith('/');

  //           return (
  //             <tr
  //               key={item.path}
  //               className={isFolder ? 'folder' : ''}
  //               style={{ cursor: isFolder ? 'pointer' : 'default' }}
  //               onClick={() =>
  //                 isFolder &&
  //                 setPathStack(prev => [...prev, `${name}/`])
  //               }
  //             >
  //               <td>
  //                 <input
  //                   type="checkbox"
  //                   checked={selected.has(item.path)}
  //                   onClick={e => e.stopPropagation()}
  //                   onChange={() => toggleSelect(item.path)}
  //                 />
  //               </td>
  //               <td>{isFolder ? '📁' : '📄'} {name}</td>
  //               <td>{isFolder ? 'Folder' : 'File'}</td>
  //               <td>{isFolder ? '—' : formatBytes(item.size)}</td>
  //               <td>
  //                 {item.lastModified
  //                   ? item.lastModified.toLocaleString()
  //                   : '—'}
  //               </td>
  //             </tr>
  //           );
  //         })}
  //       </tbody>
  //     </table>
  //   </>
  // );

  return (
    <>
      {/* {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: notification.type === 'error' ? '#f44336' : '#4caf50',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '4px',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            animation: 'slideIn 0.3s ease-in-out',
          }}
        >
          {notification.message}
        </div>
      )} */}

      {/* <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style> */}

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
                disabled={!cases.length}
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


          {isRoot ? (
            <CreateCase
              basePath={`private/${identityId}/${currentPath}`}
              onCreated={async (payload: any) => {
                const created = await createCase(payload);
                const createdCase = JSON.parse(created['item'])
                createdCase.size = 16
                setCases((prev) => [...prev, createdCase])
              }}
              disabled={loading || !identityId}
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
              // onUploadComplete={loadFiles}
            />
          )}
        </Flex>
      </Flex>

      <Divider />

      <div className="breadcrumb">
        <span
          className="breadcrumb-link"
          onClick={() => setPathStack([])}
        >
          Home
        </span>

        {pathStack.map((segment, index) => {
          const name = segment.replace('/', '');
          const isLast = index === pathStack.length - 1;

          return (
            <span key={index}>
              {' / '}
              <span
                className={!isLast ? 'breadcrumb-link' : ''}
                style={isLast ? { color: '#555' } : undefined}
                onClick={
                  !isLast
                    ? () => setPathStack(pathStack.slice(0, index + 1))
                    : undefined
                }
              >
                {name}
              </span>
            </span>
          );
        })}
      </div>

      <table className="storage-table">
        {isRoot ? (
          <CasesTableHeader />
        ) : (
          <FilesTableHeader />
        )}

        <tbody>
          {loading && (
            <tr className="loading-row">
              <td colSpan={5}>Loading…</td>
            </tr>
          )}

          {!loading && files.length === 0 && (
            <tr className="loading-row">
              <td colSpan={5}>Empty folder</td>
            </tr>
          )}

          {!loading && isRoot && sortedCases.map(renderCaseRow)}
          {!loading && !isRoot && files.map(renderFileRow)}
        </tbody>
      </table>
    </>
  );
};