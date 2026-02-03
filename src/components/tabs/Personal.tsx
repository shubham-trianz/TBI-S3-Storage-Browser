import { list } from 'aws-amplify/storage';
import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  Flex,
  Heading,
  Divider,
  // Text,
  Button,
} from "@aws-amplify/ui-react";
import { UploadButton } from "../utils/UploadButton";
import { DeleteObjects } from "../utils/DeleteObjects";
import { CreateFolder } from '../utils/CreateFolder';

// type S3Item = {
//   eTag: string,
//   path: string;
//   size?: number;
//   lastModified?: Date;
// };

export const Personal = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const currentPath = pathStack.join('');
  const selectAllRef = useRef<HTMLInputElement>(null);

  /* ------------------ AUTH INIT ------------------ */
  useEffect(() => {
    async function init() {
      const session = await fetchAuthSession();
      setIdentityId(session.identityId ?? null);
    }
    init();
  }, []);

  /* ------------------ LIST HELPERS ------------------ */
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

  /* ------------------ LOAD FILES ------------------ */
  const loadFiles = useCallback(async () => {
    if (!identityId) return;

    setLoading(true);
    setFiles([]);
    setSelected(new Set());

    try {
      const basePath = `private/${identityId}/${currentPath}`;
      const result = await list({ path: basePath });
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

  /* ------------------ SELECTION ------------------ */
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

  /* Update indeterminate state */
  useEffect(() => {
    if (!selectAllRef.current) return;

    selectAllRef.current.indeterminate =
      selected.size > 0 && selected.size < files.length;
  }, [selected, files]);

  /* ------------------ UTILS ------------------ */
  function formatBytes(bytes?: number) {
    if (!bytes) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /* ------------------ RENDER ------------------ */
  return (
    <>
      {/* 🔹 FILE PANE HEADER */}
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
          <CreateFolder
            basePath={`private/${identityId}/${currentPath}`}
            onCreated={loadFiles}
            disabled={loading || !identityId}
          />
          <DeleteObjects
            selectedPaths={[...selected]}
            onDeleted={loadFiles}
          />

          {identityId && (
            <UploadButton
              prefix={`private/${identityId}/${currentPath}`}
            />
          )}
        </Flex>
      </Flex>

      <Divider />

      {/* 🔹 BREADCRUMB */}
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

      {/* 🔹 FILE TABLE */}
      <table className="storage-table">
        <thead>
          <tr style={{ color: 'white' }}>
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
            <tr className="loading-row">
              <td colSpan={5}>Loading…</td>
            </tr>
          )}

          {!loading && files.length === 0 && (
            <tr className="loading-row">
              <td colSpan={5}>Empty folder</td>
            </tr>
          )}

          {!loading &&
            files.map(item => {
              const name = item.path.split('/').filter(Boolean).pop()!;
              const isFolder = item.path.endsWith('/');

              return (
                <tr
                  key={item.path}
                  className={isFolder ? 'folder' : ''}
                  style={{ cursor: isFolder ? 'pointer' : 'default' }}
                  onClick={() =>
                    isFolder &&
                    setPathStack(prev => [...prev, name + '/'])
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(item.path)}
                      onChange={() => toggleSelect(item.path)}
                      onClick={(e) => e.stopPropagation()}
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
