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
import { generateAndCopyLink } from "../utils/generateLink";

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
  const selectedFilePath =
    selected.size === 1 ? [...selected][0] : null;

  const isSingleFileSelected =
    !!selectedFilePath && !selectedFilePath.endsWith("/");

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

  return (
    <>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        padding="0.75rem 0"
      >
        {/* Add this right after your opening Flex */}
        {!isRoot && (
          <Flex gap="0.5rem" alignItems="center" padding="0.5rem 0">
            <Button
              size="small"
              variation="link"
              onClick={() => setPathStack([])}
            >
              Home
            </Button>
            {pathStack.map((segment, idx) => (
              <Flex key={idx} gap="0.5rem" alignItems="center">
                <span>/</span>
                <Button
                  size="small"
                  variation="link"
                  onClick={() => setPathStack(pathStack.slice(0, idx + 1))}
                >
                  {segment.replace('/', '')}
                </Button>
              </Flex>
            ))}
          </Flex>
        )}
        <Heading level={5}>Files</Heading>

        <Flex gap="0.5rem">
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
            disabled={!isSingleFileSelected}
            onClick={() => {
              if (selectedFilePath) {
                generateAndCopyLink(selectedFilePath);
              }
            }}
          >
            Generate link
          </Button>

          {isRoot ? (
            <CreateCase
              basePath={`private/${identityId}/${currentPath}`}
              onCreated={() => {
                loadCases();
              }}
              disabled={loading || !identityId}
            />
          ) : (
            <CreateFolder
              basePath={`private/${identityId}/${currentPath}`}
              onCreated={() => {
                loadFiles();
              }}
              disabled={loading || !identityId}
            />
          )}

          <DeleteObjects
            selectedPaths={[...selected]}
            onDeleted={loadFiles}
          />

          {identityId && !isRoot && (
            <UploadButton
              prefix={`private/${identityId}/${currentPath}`}
            />
          )}
        </Flex>
      </Flex>

      <Divider />

      <table className="storage-table">
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

        <tbody>
          {loading && (
            <tr>
              <td colSpan={5}>Loading…</td>
            </tr>
          )}

          {!loading && files.length === 0 && (
            <tr>
              <td colSpan={5}>Empty folder</td>
            </tr>
          )}

          {!loading && files.map(item => {
            const name = item.path.split('/').filter(Boolean).pop();
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
          })}
        </tbody>
      </table>
    </>
  );
};