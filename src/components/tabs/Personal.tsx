import { list } from 'aws-amplify/storage';
import { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

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
  // const [currentPath, setCurrentPath] = useState<string>('');
  const [pathStack, setPathStack] = useState<string[]>([]);
  const currentPath = pathStack.join('');
  console.log('currentPath: ', currentPath)

  useEffect(() => {
    async function init() {
      const session = await fetchAuthSession();
      console.log('identityId: ', session.identityId)
      setIdentityId(session.identityId ?? null);
    }
    init();
  }, []);

  // function getFirstLevelItems(items: any[], basePath: string): any[] {
  //   const seen = new Set<string>();

  //       return items.filter(item => {
  //           const relative = item.path.replace(basePath, '');
  //           const parts = relative.split('/').filter(Boolean);

  //           if (parts.length === 1) {
  //           return true; // file
  //           }

  //           if (parts.length > 1) {
  //           const folderPath = basePath + parts[0] + '/';
  //           if (seen.has(folderPath)) return false;

  //           seen.add(folderPath);
  //           item.path = folderPath;
  //           return true;
  //           }

  //           return false;
  //       });
  //   }

  function getFirstLevelItems(
  items: any[],
  basePath: string
): any[] {
  const map = new Map<string, any>();

  for (const item of items) {
    const relative = item.path.replace(basePath, '');
    const parts = relative.split('/').filter(Boolean);

    // File at current level
    if (parts.length === 1 && !item.path.endsWith('/')) {
      map.set(item.path, item);
      continue;
    }

    // Folder at current level
    if (parts.length >= 1) {
      const folderPath = basePath + parts[0] + '/';

      if (!map.has(folderPath)) {
        map.set(folderPath, {
          path: folderPath,
          size: 0,
        });
      }
    }
  }

  return Array.from(map.values());
}


  useEffect(() => {
    if (!identityId) return;

    async function loadFiles() {
      setLoading(true);
      setFiles([]);

      try {
        const basePath = `private/${identityId}/${currentPath}`;

        const result = await list({
          path: basePath,
        });
        console.log('result: ', result)
        setFiles(getFirstLevelItems(result.items, basePath));
      } catch (err) {
        console.error('Error listing files', err);
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [identityId, currentPath]);

  function formatBytes(bytes?: number) {
    if (!bytes) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  // if (loading) return <p>Loading...</p>;

  return (
    <>
      {/* <div>
        Root /
        {pathStack.map((p, i) => (
          <span
            key={i}
            style={{ cursor: 'pointer' }}
            onClick={() => setPathStack(pathStack.slice(0, i + 1))}
          >
            {p}
          </span>
        ))}
      </div> */}
      {/* <div style={{ marginBottom: 10, textAlign: 'left' }}>
        <span
          style={{ cursor: 'pointer', color: 'blue' }}
          onClick={() => setPathStack([])}
        >
          Root
        </span>

        {pathStack.map((segment, index) => {
          const name = segment.replace('/', '');

          return (
            <span key={index}>
              {' / '}
              <span
                style={{ cursor: 'pointer', color: 'blue', }}
                onClick={() =>
                  setPathStack(pathStack.slice(0, index + 1))
                }
              >
                {name}
              </span>
            </span>
          );
        })}
      </div> */}
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
        <thead>
          <tr style={{color: 'white'}}>
            <th>Name</th>
            <th>Type</th>
            <th>Size</th>
            <th>Last Modified</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr className="loading-row">
              <td colSpan={4}>Loading…</td>
            </tr>
          )}

          {!loading && files.length === 0 && (
            <tr className="loading-row">
              <td colSpan={4}>Empty folder</td>
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
                  <td>{isFolder ? '📁' : '📄'} {name}</td>
                  <td className="type">{isFolder ? 'Folder' : 'File'}</td>
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



      <br />
      {/* <UploadButton /> */}
    </>
  );
};
