import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Flex,
  Heading,
  Text,
  TextField,
  Badge,
} from '@aws-amplify/ui-react';
import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  CommonPrefix,
} from '@aws-sdk/client-s3';
import { createS3Client } from '../s3.service';
import amplifyConfig from '../../../amplify_outputs.json';
import { CasesAPI } from '../../api/cases/cases.api';
import toast from 'react-hot-toast';

interface Case {
  case_number: string;
  case_title?: string;
  source_key: string;
}

interface TempEvidenceMeta {
  source_key: string;
  evidence_type?: string;
  description?: string;
}

interface MoveDialogProps {
  open: boolean;
  files: string[];
  identityId: string;
  cases: Case[];
  tempEvidence: TempEvidenceMeta[];
  onClose: () => void;
  onMoved: () => void;
}

type TreeNodeState = {
  children: string[];
  loaded: boolean;
  expanded: boolean;
  loading?: boolean;
};

const ensureTrailingSlash = (p: string) => (p.endsWith('/') ? p : `${p}/`);
const stripTrailingSlash = (p: string) => p.replace(/\/$/, '');
const getFolderName = (full: string, root: string) => {
  const rel = stripTrailingSlash(full).replace(ensureTrailingSlash(root), '');
  const parts = rel.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
};

const encodeCopySource = (bucket: string, key: string) =>
  `${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;

const ancestorsFromRoot = (root: string, target: string): string[] => {
  const rel = target.replace(root, '');
  const parts = rel.split('/').filter(Boolean);
  const result: string[] = [];
  let cursor = root;
  for (const part of parts) {
    cursor = `${cursor}${part}/`;
    result.push(cursor);
  }
  return result;
};


const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M7 5l6 5-6 5V5z" fill="currentColor" />
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
  </svg>
);
const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden style={{ color: '#6b7280' }}>
    <path
      fill="currentColor"
      d="M10 4l2 2h6a2 2 0 012 2v1H4V6a2 2 0 012-2h4zm10 6H4v8a2 2 0 002 2h12a2 2 0 002-2v-8z"
    />
  </svg>
);
const Spinner = () => (
  <span
    aria-label="Loading"
    style={{
      width: 14,
      height: 14,
      border: '2px solid #cbd5e1',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'move-dialog-spin 0.9s linear infinite',
    }}
  />
);
const MagnifierIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden style={{ marginRight: 6 }}>
    <path
      fill="currentColor"
      d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
    />
  </svg>
);


export const MoveDialog = ({
  open,
  files,
  cases,
  tempEvidence,
  onClose,
  onMoved,
}: MoveDialogProps) => {
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [moving, setMoving] = useState<boolean>(false);

  const s3Ref = useRef<S3Client | null>(null);
  const bucket: string = amplifyConfig.storage.bucket_name;

  const modalRef = useRef<HTMLDivElement | null>(null);

  const [rootPrefix, setRootPrefix] = useState<string>('');
  const [tree, setTree] = useState<Record<string, TreeNodeState>>({});
  const [selectedPrefix, setSelectedPrefix] = useState<string>('');

  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchIndex, setSearchIndex] = useState<string[] | null>(null);
  const [indexing, setIndexing] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchPopoverRef = useRef<HTMLDivElement | null>(null);
  const [searchStyle, setSearchStyle] = useState<React.CSSProperties>({});

  const [newFolder, setNewFolder] = useState<string>('');
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);

  useEffect(() => {
    createS3Client().then((c) => (s3Ref.current = c as S3Client));
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedCase('');
      setTree({});
      setRootPrefix('');
      setSelectedPrefix('');
      setSearchIndex(null);
      setQuery('');
      setShowSearch(false);
      setNewFolder('');
    }
  }, [open]);


  const listImmediateSubfolders = async (prefix: string): Promise<string[]> => {
    if (!s3Ref.current) return [];
    const folders: string[] = [];
    let ContinuationToken: string | undefined;

    do {
      const res: ListObjectsV2CommandOutput = await s3Ref.current.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          Delimiter: '/',
          ContinuationToken,
        })
      );
      const cps: string[] = (res.CommonPrefixes ?? []).map(
        (p: CommonPrefix) => p.Prefix ?? ''
      );
      folders.push(...cps.filter(Boolean));
      ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (ContinuationToken);

    return folders.filter((p) => p !== prefix);
  };

  const listAllSubfolders = async (root: string, maxFolders = 50000): Promise<string[]> => {
    const result: string[] = [];
    const stack: string[] = [root];

    while (stack.length) {
      const current = stack.pop()!;
      const subs = await listImmediateSubfolders(current);
      for (const f of subs) {
        result.push(f);
        stack.push(f);
        if (result.length >= maxFolders) return result;
      }
    }
    return result;
  };

  const initCaseRoot = async (caseNum: string): Promise<void> => {
    const caseObj = cases.find((c) => c.case_number === caseNum);
    if (!caseObj) return;

    const caseRoot = ensureTrailingSlash(caseObj.source_key);
    setRootPrefix(caseRoot);
    setSelectedPrefix(caseRoot);

    setTree({
      [caseRoot]: { children: [], loaded: false, expanded: true, loading: false },
    });

    try {
      setTree((prev) => ({
        ...prev,
        [caseRoot]: { ...prev[caseRoot], loading: true },
      }));
      const children = await listImmediateSubfolders(caseRoot);
      setTree((prev) => ({
        ...prev,
        [caseRoot]: { children, loaded: true, expanded: true, loading: false },
      }));
    } catch (e) {
      console.error('Failed to load root folders', e);
      setTree((prev) => ({
        ...prev,
        [caseRoot]: { children: [], loaded: true, expanded: true, loading: false },
      }));
    }
  };

  const toggleNode = async (prefix: string): Promise<void> => {
    const current = tree[prefix];
    const isExpanded = current?.expanded;

    if (current && current.loaded && isExpanded) {
      setTree((prev) => ({
        ...prev,
        [prefix]: { ...prev[prefix], expanded: false },
      }));
      return;
    }

    setTree((prev) => {
      const node = prev[prefix] ?? { children: [], loaded: false, expanded: false };
      return {
        ...prev,
        [prefix]: { ...node, expanded: true, loading: !node.loaded },
      };
    });

    const node = tree[prefix];
    const loaded = node?.loaded;
    if (!loaded) {
      try {
        const children = await listImmediateSubfolders(prefix);
        setTree((prev) => ({
          ...prev,
          [prefix]: { children, loaded: true, expanded: true, loading: false },
        }));
      } catch (e) {
        console.error('Failed to load children', e);
        setTree((prev) => ({
          ...prev,
          [prefix]: { children: [], loaded: true, expanded: true, loading: false },
        }));
      }
    }
  };

  const ensureAncestorsExpanded = async (target: string): Promise<void> => {
    if (!rootPrefix) return;
    const chain = ancestorsFromRoot(rootPrefix, target);
    let cursor = rootPrefix;

    setTree((prev) => ({
      [rootPrefix]: prev[rootPrefix] ?? { children: [], loaded: false, expanded: true },
      ...prev,
    }));

    for (const prefix of chain) {
      const parentNode = tree[cursor];
      if (!parentNode?.loaded) {
        setTree((prev) => ({
          ...prev,
          [cursor]: { ...(prev[cursor] ?? { children: [] }), expanded: true, loading: true },
        }));
        const children = await listImmediateSubfolders(cursor);
        setTree((prev) => ({
          ...prev,
          [cursor]: { children, loaded: true, expanded: true, loading: false },
        }));
      } else {
        setTree((prev) => ({
          ...prev,
          [cursor]: { ...prev[cursor], expanded: true },
        }));
      }
      cursor = prefix;
    }
  };

  const computeSearchPosition = () => {
    const btn = searchBtnRef.current;
    const pane = searchPopoverRef.current;
    const modal = modalRef.current;
    if (!btn || !pane || !modal) return;

    const btnRect = btn.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();

    const width = 320;
    const margin = 8;

    const btnRightRel = btnRect.right - modalRect.left;
    const btnLeftRel = btnRect.left - modalRect.left;
    const btnBottomRel = btnRect.bottom - modalRect.top;

    const modalWidth = modalRect.width;

    let left = btnRightRel - width;
    let top = btnBottomRel + margin;

    // Clamp inside modal (keep 12px padding)
    const pad = 12;
    if (left + width > modalWidth - pad) {
      left = modalWidth - pad - width;
    }
    if (left < pad) {
      // Flip to left of the button if needed but still clamp
      left = Math.max(pad, btnLeftRel);
      // If still overflowing, clamp
      if (left + width > modalWidth - pad) {
        left = modalWidth - pad - width;
      }
    }

    // Set absolute position relative to modal (the modal container must be position:relative)
    setSearchStyle({
      position: 'absolute',
      top,
      left,
      width,
      borderRadius: 10,
    });
  };

  const toggleSearch = async () => {
    const next = !showSearch;
    setShowSearch(next);
    if (next) {
      // Position after render
      requestAnimationFrame(() => {
        computeSearchPosition();
      });
      if (!searchIndex) {
        await buildIndexIfNeeded();
      }
    }
  };

  // Outside click & Esc to close
  useEffect(() => {
    if (!showSearch) return;
    const onClick = (e: MouseEvent) => {
      const pane = searchPopoverRef.current;
      const btn = searchBtnRef.current;
      if (!pane) return;
      const target = e.target as Node;
      if (pane.contains(target)) return;
      if (btn && btn.contains(target)) return;
      setShowSearch(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [showSearch]);

  // Reposition on resize/scroll while open
  useEffect(() => {
    if (!showSearch) return;
    const onReposition = () => computeSearchPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [showSearch]);

  // Ctrl/Cmd+K toggles search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSearch, searchIndex]);

  const buildIndexIfNeeded = async (): Promise<void> => {
    if (!rootPrefix || searchIndex) return;
    try {
      setIndexing(true);
      const all = await listAllSubfolders(rootPrefix);
      setSearchIndex(all);
    } catch (e) {
      console.error('Failed to build folder index', e);
    } finally {
      setIndexing(false);
    }
  };

  const filteredSearch = useMemo<string[]>(() => {
    if (!searchIndex || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const scored = searchIndex.map((p) => {
      const leaf = getFolderName(p, rootPrefix).toLowerCase();
      const score =
        (leaf.includes(q) ? 0 : 100) +
        (p.toLowerCase().includes(q) ? 0 : 1000) +
        p.length * 0.0001;
      return { p, score };
    });
    return scored
      .sort((a, b) => a.score - b.score)
      .slice(0, 50)
      .map((s) => s.p);
  }, [query, searchIndex, rootPrefix]);

  // ---------- Move logic ----------

  const getDestinationPrefix = (): string | null =>
    selectedPrefix ? selectedPrefix : rootPrefix || null;

  const handleMove = async (): Promise<void> => {
    const dest = getDestinationPrefix();
    if (!dest || !s3Ref.current) return;

    setMoving(true);
    try {
      for (const key of files) {
        const filename = key.split('/').pop();
        if (!filename) continue;
        const destKey = `${dest}${filename}`;

        await s3Ref.current.send(
          new CopyObjectCommand({
            Bucket: bucket,
            CopySource: encodeCopySource(bucket, key),
            Key: destKey,
          })
        );

        await s3Ref.current.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );

        const existingMeta = tempEvidence.find(
          (ev) => ev.source_key === key || ev.source_key?.split('/').pop() === filename
        );

        await CasesAPI.createEvidence(selectedCase, {
          source_key: destKey,
          evidence_type: existingMeta?.evidence_type ?? '',
          description: existingMeta?.description ?? '',
          uploaded_at: new Date().toISOString(),
        });
      }

      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} moved successfully`);
      onMoved();
      onClose();
    } catch (err) {
      console.error('Move failed', err);
      toast.error('Move failed. Please try again.');
    } finally {
      setMoving(false);
    }
  };

  // ---------- Create folder (supports nested path) ----------

  const createFolder = async (): Promise<void> => {
    const base = getDestinationPrefix();
    if (!base || !s3Ref.current) return;

    const raw = newFolder.trim().replace(/^\/+|\/+$/g, '');
    if (!raw) {
      toast.error('Enter a folder name');
      return;
    }

    const segments = raw.split('/').filter(Boolean);
    const prefixesToCreate: string[] = [];
    let cursor = base;
    for (const seg of segments) {
      if (!seg || /[\\]/.test(seg)) {
        toast.error('Folder name contains invalid characters');
        return;
      }
      const next = `${cursor}${seg}/`;
      prefixesToCreate.push(next);
      cursor = next;
    }

    setCreatingFolder(true);
    try {
      for (const p of prefixesToCreate) {
        await s3Ref.current.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: p,
            Body: new Uint8Array(),
          })
        );
        const parent = p.substring(0, p.slice(0, -1).lastIndexOf('/') + 1);
        setTree((prev) => {
          const parentNode: TreeNodeState = prev[parent] ?? {
            children: [],
            loaded: true,
            expanded: true,
          };
          const children = parentNode.children.includes(p)
            ? parentNode.children
            : [...parentNode.children, p];
          return {
            ...prev,
            [parent]: { ...parentNode, children, loaded: true, expanded: true },
            [p]: prev[p] ?? { children: [], loaded: false, expanded: false },
          };
        });
      }

      setSelectedPrefix(prefixesToCreate[prefixesToCreate.length - 1]);
      setNewFolder('');
      toast.success('Folder created');
    } catch (e) {
      console.error('Create folder failed', e);
      toast.error('Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  // ---------- UI helpers ----------

  const Breadcrumb = () => {
    if (!rootPrefix || !selectedPrefix) return null;
    const rel = selectedPrefix.replace(rootPrefix, '');
    const parts = rel.split('/').filter(Boolean);
    const crumbs = [{ label: 'Case root', prefix: rootPrefix }];
    let cursor = rootPrefix;
    for (const part of parts) {
      cursor = `${cursor}${part}/`;
      crumbs.push({ label: part, prefix: cursor });
    }
    return (
      <Flex wrap="wrap" alignItems="center" gap="0.25rem">
        {crumbs.map((c, i) => (
          <Flex key={c.prefix} alignItems="center" gap="0.25rem">
            {i > 0 && <span style={{ color: '#999' }}>›</span>}
            <Button
              size="small"
              variation={c.prefix === selectedPrefix ? 'primary' : 'link'}
              onClick={async () => {
                await ensureAncestorsExpanded(c.prefix);
                setSelectedPrefix(c.prefix);
              }}
            >
              {c.label}
            </Button>
          </Flex>
        ))}
      </Flex>
    );
  };

  const CasePicker = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'end' }}>
      <div className="amplify-selectfield">
        <label className="amplify-label">Select Case</label>
        <select
          className="amplify-select"
          value={selectedCase}
          onChange={async (e) => {
            const val = e.target.value;
            setSelectedCase(val);
            setTree({});
            setSearchIndex(null);
            setQuery('');
            setShowSearch(false);
            setNewFolder('');
            if (val) await initCaseRoot(val);
          }}
        >
        <option value="">-- Pick a case --</option>
          {cases.map((c) => (
            <option key={c.case_number} value={c.case_number}>
              {c.case_number}
              {c.case_title ? ` — ${c.case_title}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Smaller, subtle Search button */}
      <Button
        ref={searchBtnRef as any}
        size="small"
        variation="link"
        onClick={toggleSearch}
        aria-expanded={showSearch}
        aria-controls="folder-search-popover"
      >
        <MagnifierIcon />
        Search
      </Button>
    </div>
  );

  const TreeNodeRow: React.FC<{ prefix: string; level: number }> = ({ prefix, level }) => {
    const node: TreeNodeState = tree[prefix] ?? { children: [], loaded: false, expanded: false };
    const isSelected = selectedPrefix === prefix;
    const name = prefix === rootPrefix ? 'Case root' : getFolderName(prefix, rootPrefix);
    const showChevron = !node.loaded || (node.loaded && node.children.length > 0);

    const handleToggle = async () => {
      if (showChevron) await toggleNode(prefix);
      setSelectedPrefix(prefix);
    };

    return (
      <div>
        <div
          onClick={handleToggle}
          onDoubleClick={handleToggle}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              await handleToggle();
            }
            if (e.key === 'ArrowRight' && showChevron && !node.expanded) {
              e.preventDefault();
              await toggleNode(prefix);
            }
            if (e.key === 'ArrowLeft' && node.expanded) {
              e.preventDefault();
              await toggleNode(prefix);
            }
          }}
          tabIndex={0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '6px 8px',
            marginLeft: level * 14,
            borderRadius: 6,
            cursor: 'pointer',
            background: isSelected ? 'rgba(33, 150, 243, 0.10)' : 'transparent',
            border: isSelected ? '1px solid rgba(33,150,243,0.35)' : '1px solid transparent',
            outline: 'none',
          }}
          role="treeitem"
          aria-expanded={showChevron ? !!node.expanded : undefined}
          aria-selected={isSelected}
          aria-label={name}
        >
          {/* Chevron / spinner column */}
          <span
            style={{
              width: 14,
              height: 14,
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#4b5563',
            }}
          >
            {node.loading ? (
              <Spinner />
            ) : showChevron ? (
              node.expanded ? <ChevronDown /> : <ChevronRight />
            ) : null}
          </span>

          {/* Folder icon */}
          <FolderIcon />

          {/* Name */}
          <span style={{ fontWeight: prefix === rootPrefix ? 600 : 500 }}>{name}</span>

          {prefix === rootPrefix && (
            <Badge size="small" variation="info" style={{ marginLeft: 8 }}>
              root
            </Badge>
          )}
        </div>

        {node.expanded &&
          node.loaded &&
          node.children
            .slice()
            .sort((a, b) =>
              getFolderName(a, rootPrefix).localeCompare(getFolderName(b, rootPrefix))
            )
            .map((child) => <TreeNodeRow key={child} prefix={child} level={level + 1} />)}
      </div>
    );
  };

  const TreePane = () => {
    const rootNode = tree[rootPrefix];
    return (
      <div
        role="tree"
        aria-label="Folders"
        style={{
          border: '1px solid var(--amplify-colors-neutral-20)',
          borderRadius: 8,
          padding: 8,
          maxHeight: 340,
          overflow: 'auto',
          background: '#fafafa',
        }}
      >
        {!rootPrefix ? (
          <Text variation="tertiary">Select a case to view folders.</Text>
        ) : rootNode?.loading && !rootNode.loaded ? (
          <Text variation="tertiary">Loading folders…</Text>
        ) : rootNode?.loaded && rootNode.children.length === 0 ? (
          <Text variation="tertiary">No folders yet. Create one on the right.</Text>
        ) : (
          rootNode?.children
            .slice()
            .sort((a, b) =>
              getFolderName(a, rootPrefix).localeCompare(getFolderName(b, rootPrefix))
            )
            .map((p) => <TreeNodeRow key={p} prefix={p} level={0} />)
        )}
      </div>
    );
  };

  const SearchPane = () => {
    if (!showSearch) return null;

    return (
      <div
        id="folder-search-popover"
        ref={searchPopoverRef}
        style={{
          ...searchStyle,
          background: 'white',
          border: '1px solid var(--amplify-colors-neutral-20)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: 10,
            borderBottom: '1px solid var(--amplify-colors-neutral-20)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <TextField
            label=""
            placeholder={indexing ? 'Indexing folders…' : 'Search folders by name or path'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            isDisabled={indexing}
            autoFocus
            width="100%"
          />
          <Button size="small" onClick={() => setShowSearch(false)}>
            Close
          </Button>
        </div>

        <div style={{ maxHeight: 280, overflow: 'auto' }}>
          {!searchIndex && !indexing ? (
            <div style={{ padding: 12 }}>
              <Button size="small" onClick={buildIndexIfNeeded}>
                Build index
              </Button>
              <Text variation="tertiary" as="span" style={{ marginLeft: 8 }}>
                (one-time per case)
              </Text>
            </div>
          ) : indexing ? (
            <div style={{ padding: 12 }}>
              <Text variation="tertiary">Building index…</Text>
            </div>
          ) : filteredSearch.length === 0 ? (
            <div style={{ padding: 12 }}>
              <Text variation="tertiary">No matches</Text>
            </div>
          ) : (
            filteredSearch.map((p) => {
              const rel = p.replace(rootPrefix, '');
              return (
                <div
                  key={p}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  onClick={async () => {
                    await ensureAncestorsExpanded(p);
                    setSelectedPrefix(p);
                    setShowSearch(false);
                  }}
                >
                  <strong>{getFolderName(p, rootPrefix)}</strong>
                  <div style={{ color: '#888', fontSize: 12 }}>{rel}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (!open) return null;

  const destLabel = useMemo(() => {
    if (!selectedCase || !rootPrefix) return null;
    const rel = selectedPrefix
      ? stripTrailingSlash(selectedPrefix.replace(rootPrefix, '')) || '(case root)'
      : '(case root)';
    return `${selectedCase} / ${rel}`;
  }, [selectedCase, rootPrefix, selectedPrefix]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* inline keyframes for spinner */}
      <style>
        {`@keyframes move-dialog-spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}
      </style>

      <div
        ref={modalRef}
        style={{
          position: 'relative', // important: anchor search popover inside modal
          background: 'white',
          borderRadius: 12,
          padding: '1.25rem 1.25rem 1rem',
          minWidth: 720,
          maxWidth: 980,
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          overflow: 'visible', // allow popover to render within this stacking context
        }}
      >
        <Heading level={5} marginBottom="0.25rem">
          Move Files
        </Heading>
        <Text variation="tertiary" fontSize="small" marginBottom="1rem">
          Moving {files.length} file{files.length > 1 ? 's' : ''} to a case folder
        </Text>

        {/* Anchored & clamped Search popover */}
        <SearchPane />

        <Flex direction="column" gap="0.75rem">
          <CasePicker />

          {selectedCase && (
            <>
              <Breadcrumb />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  alignItems: 'start',
                }}
              >
                {/* Left: Tree */}
                <div>
                  <Text variation="tertiary" fontSize="small" style={{ marginBottom: 6 }}>
                    Folders
                  </Text>
                  <TreePane />
                </div>

                {/* Right: Destination + Create folder */}
                <div
                  style={{
                    border: '1px solid var(--amplify-colors-neutral-20)',
                    borderRadius: 8,
                    padding: 12,
                    minHeight: 120,
                    background: '#fff',
                  }}
                >
                  <Text variation="tertiary" fontSize="small">
                    Destination
                  </Text>
                  <div style={{ marginTop: 6, marginBottom: 12 }}>
                    <strong>{destLabel}</strong>
                  </div>

                  <Flex gap="0.5rem" alignItems="flex-end" wrap="wrap">
                    <TextField
                      label="Create folder (optional)"
                      placeholder="e.g. Evidence/Images/2026-03"
                      value={newFolder}
                      onChange={(e) => setNewFolder(e.target.value)}
                      width="100%"
                    />
                    <Button
                      size="small"
                      onClick={createFolder}
                      isLoading={creatingFolder}
                      loadingText="Creating..."
                    >
                      Create
                    </Button>
                  </Flex>

                  <Text variation="tertiary" fontSize="xs" style={{ marginTop: 8, display: 'block' }}>
                    New folder(s) will be created under the selected destination. You can enter a nested
                    path like <code>Evidence/Images/2026-03</code>.
                  </Text>
                </div>
              </div>
            </>
          )}
        </Flex>

        <Flex justifyContent="flex-end" gap="0.5rem" marginTop="1rem">
          <Button size="small" onClick={onClose} disabled={moving}>
            Cancel
          </Button>
          <Button
            size="small"
            variation="primary"
            isLoading={moving}
            loadingText="Moving..."
            disabled={!selectedCase || !selectedPrefix || moving}
            onClick={handleMove}
          >
            Move here
          </Button>
        </Flex>
      </div>
    </div>
  );
};