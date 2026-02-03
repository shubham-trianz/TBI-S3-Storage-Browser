import { useEffect, useState, useCallback, useRef } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  Flex,
  Heading,
  Divider,
  Button,
} from "@aws-amplify/ui-react";
import { UploadButton } from "../utils/UploadButton";
import { DeleteObjects } from "../utils/DeleteObjects";
import { CreateFolder } from "../utils/CreateFolder";
import { fetchCases } from "../../api/cases";

export const Personal = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const currentPath = pathStack.join("");
  const selectAllRef = useRef<HTMLInputElement>(null);

  /* ------------------ AUTH INIT ------------------ */
  useEffect(() => {
    async function init() {
      const session = await fetchAuthSession();
      setIdentityId(session.identityId ?? null);
    }
    init();
  }, []);

  /* ------------------ LOAD CASES ------------------ */
  const loadCases = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());

    try {
      const items = await fetchCases();
      setFiles(items);
    } catch (err) {
      console.error("Error loading cases", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  /* ------------------ SELECTION ------------------ */
  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map(f => f.case_number)));
    }
  };

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      selected.size > 0 && selected.size < files.length;
  }, [selected, files]);

  /* ------------------ SORTING ------------------ */
  const sortBy = (key: string) => {
    setSortDir(prev =>
      sortKey === key && prev === "asc" ? "desc" : "asc"
    );
    setSortKey(key);
  };

  const sortedFiles = [...files].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (typeof aVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }

    return sortDir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  /* ------------------ UTILS ------------------ */
  function formatBytes(bytes?: number) {
    if (!bytes) return "—";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /* ------------------ RENDER ------------------ */
  return (
    <>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        padding="0.75rem 0"
      >
        <Heading level={5}>Cases</Heading>

        <Flex gap="0.5rem">
          <Button
            size="small"
            variation="secondary"
            onClick={loadCases}
            isLoading={loading}
          >
            Refresh
          </Button>

          <CreateFolder
            basePath={`private/${identityId}/${currentPath}`}
            onCreated={loadCases}
            disabled={loading || !identityId}
          />

          <DeleteObjects
            selectedPaths={[...selected]}
            onDeleted={loadCases}
          />

          {identityId && (
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
            <th onClick={() => sortBy("case_number")}>Case #</th>
            <th onClick={() => sortBy("case_agents")}>Agents</th>
            <th onClick={() => sortBy("case_title")}>Title</th>
            <th onClick={() => sortBy("content_length")}>Size</th>
            <th onClick={() => sortBy("created_at")}>Created</th>
            <th onClick={() => sortBy("jurisdiction")}>Jurisdiction</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={7}>Loading…</td>
            </tr>
          )}

          {!loading && sortedFiles.length === 0 && (
            <tr>
              <td colSpan={7}>No cases found</td>
            </tr>
          )}

          {!loading &&
            sortedFiles.map(item => (
              <tr key={item.case_number}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(item.case_number)}
                    onChange={() => toggleSelect(item.case_number)}
                  />
                </td>
                <td>{item.case_number}</td>
                <td>{item.case_agents}</td>
                <td>{item.case_title}</td>
                <td>{formatBytes(item.content_length)}</td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
                <td>{item.jurisdiction?.join(", ")}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
};
