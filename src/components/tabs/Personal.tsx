import { list } from 'aws-amplify/storage';
import { useEffect, useState, useCallback, useRef } from 'react';
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

export const Personal = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cases, setCases] = useState([]);
  // const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  
  const currentPath = pathStack.join('');
  const isRoot = pathStack.length === 0;

  const selectAllRef = useRef<HTMLInputElement>(null);

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

  const loadCases = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
      console.log('apiBaseUrl: ', apiBaseUrl)
      const res = await fetch(
        `${apiBaseUrl}/cases`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
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

  /* ...existing code... */
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

  /* ...existing code... */
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

  /* ...existing code... */
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

  /* ...existing code... */
  useEffect(() => {
    if (!selectAllRef.current) return;

    selectAllRef.current.indeterminate =
      selected.size > 0 && selected.size < files.length;
  }, [selected, files]);

  /* ...existing code... */
  function formatBytes(bytes?: number) {
    if (!bytes) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

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
        <th>Case Number</th>
        <th>Case Title</th>
        <th>Case Agent</th>
        <th>Jurisdiction</th>
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
        <td>{item.jurisdiction}</td>
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
          <Button
            size="small"
            onClick={loadFiles}
            isLoading={loading}
          >
            Refresh
          </Button>
          {isRoot ? (
            <CreateCase
              basePath={`private/${identityId}/${currentPath}`}
              onCreated={() => {
                loadCases();
              }}
              disabled={loading || !identityId}
              // onDuplicateError={showNotification}
              // folderExists={folderExists}
              // refreshCases={loadCases}
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
              onUploadComplete={loadFiles}
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
          Root
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

          {!loading && isRoot && cases.map(renderCaseRow)}
          {!loading && !isRoot && files.map(renderFileRow)}
        </tbody>
      </table>
    </>
  );
};