import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Image,
  Film,
  Music,
  FileCode,
  Download,
  HardDrive,
  FileCheck,
  CheckSquare,
  Square,
  Briefcase,
  Users,
  MapPin,
  Shield,
  Lock,
  Clock,
  Archive,
  Eye,
} from "lucide-react";
import { Case, EvidenceItem } from "../api/cases/cases.types";
import logo from "../assets/logo.png";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
type FileItem = {
  name: string;
  key: string;
  size: number;
  lastModified: string | null;
  type: "file" | "folder";
};
type FolderState = { [key: string]: boolean };

/* ─────────────────────────────────────────────────────────────────────────────
   Theme tokens
───────────────────────────────────────────────────────────────────────────── */
const theme = {
  pageBg:             "#f4f6fa",
  surfaceBg:          "#ffffff",
  sidebarBg:          "#ffffff",
  casePanelBg:        "#fffbeb",
  metaCardBg:         "#ffffff",
  evidenceCardBg:     "rgba(22,163,74,0.04)",
  border:             "#e5e7eb",
  borderStrong:       "#d1d5db",
  evidenceBorder:     "rgba(22,163,74,0.2)",
  textPrimary:        "#111827",
  textSecondary:      "#374151",
  textMuted:          "#6b7280",
  textTiny:           "#9ca3af",
  textEvidence:       "#166534",
  textMeta:           "#374151",
  gold:               "#b45309",
  goldBg:             "rgba(180,83,9,0.08)",
  goldBorder:         "rgba(180,83,9,0.2)",
  green:              "#16a34a",
  chevron:            "#9ca3af",
  fileInactive:       "#6b7280",
  fileActiveText:     "#b45309",
  fileActiveBg:       "rgba(180,83,9,0.07)",
  fileActiveBorder:   "#b45309",
  folderName:         "#374151",
  checkInactive:      "#d1d5db",
  topBarBorder:       "#e5e7eb",
  divider:            "#e5e7eb",
  metaDivider:        "#f3f4f6",
  metaKey:            "#9ca3af",
  metaCardHeader:     "#9ca3af",
  caseLabelColor:     "#92400e",
  caseKeyColor:       "#b45309",
  caseValColor:       "#374151",
  evidenceLabelColor: "#166534",
  evidenceKeyColor:   "rgba(22,163,74,0.7)",
  spinnerColor:       "#b45309",
  emptyIconColor:     "#d1d5db",
  emptyTextColor:     "#9ca3af",
  overlayBg:          "#f4f6fa",
  overlayCardBg:      "#ffffff",
  overlayTitle:       "#111827",
  overlayMsg:         "#6b7280",
  overlayIconBg:      "rgba(180,83,9,0.08)",
  scrollThumb:        "rgba(107,114,128,0.3)",
  scrollThumbHover:   "rgba(107,114,128,0.5)",
  btnPrimaryBg:       "#b45309",
  btnPrimaryText:     "#ffffff",
  btnSecBg:           "rgba(180,83,9,0.06)",
  btnSecText:         "#b45309",
  btnSecBorder:       "rgba(180,83,9,0.2)",
  previewCaption:     "#9ca3af",
};

type Theme = typeof theme;

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
const Spinner = ({ size = 24, color = "#c8a96e" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: "spin 0.9s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.25" strokeWidth="2.5" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const getFileIcon = (fileName: string, size = 15, color = "#6b7a99") => {
  const lower = fileName.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) return <Image size={size} color={color} />;
  if (lower.match(/\.(mp4|webm|ogg|avi|mov)$/))          return <Film size={size} color={color} />;
  if (lower.match(/\.(mp3|wav|aac|flac|m4a)$/))          return <Music size={size} color={color} />;
  if (lower.match(/\.(pdf|txt|csv|log|json|xml|html|css|js|ts|tsx)$/))
                                                          return <FileCode size={size} color={color} />;
  return <FileText size={size} color={color} />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
};

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

/* ─────────────────────────────────────────────────────────────────────────────
   OverlayScreen
───────────────────────────────────────────────────────────────────────────── */
const OverlayScreen = ({
  icon, title, message, action, t,
}: {
  icon: React.ReactNode; title: string; message: string;
  action?: React.ReactNode; t: Theme;
}) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100vh", width: "100vw", margin: 0, padding: 0,
    backgroundColor: t.overlayBg,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: "background 0.25s",
  }}>
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: "1.25rem", padding: "3rem 2.5rem",
      backgroundColor: t.overlayCardBg,
      border: `1px solid ${t.borderStrong}`,
      borderRadius: "14px", maxWidth: "420px", textAlign: "center",
      transition: "background 0.25s, border 0.25s",
    }}>
      <div style={{
        width: 80, height: 80, display: "flex", alignItems: "center",
        justifyContent: "center", borderRadius: "50%",
        backgroundColor: t.overlayIconBg,
      }}>{icon}</div>
      <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700,
                   color: t.overlayTitle, letterSpacing: "0.01em" }}>{title}</h2>
      <p style={{ margin: 0, fontSize: "0.88rem", color: t.overlayMsg, lineHeight: "1.6" }}>{message}</p>
      {action}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   FileRow
───────────────────────────────────────────────────────────────────────────── */
const FileRow = ({
  file, isActive, isChecked, hasEvidence, onSelect, onToggle, t,
}: {
  file: FileItem; isActive: boolean; isChecked: boolean;
  hasEvidence: boolean; onSelect: () => void; onToggle: () => void; t: Theme;
}) => (
  <div style={{
    display: "flex", alignItems: "center", gap: "0.25rem",
    transition: "background 0.12s",
    backgroundColor: isActive ? t.fileActiveBg : "transparent",
    borderLeft: `2px solid ${isActive ? t.fileActiveBorder : "transparent"}`,
    paddingRight: "0.5rem",
  }}>
    <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{ background: "none", border: "none", cursor: "pointer",
               padding: "0.35rem", display: "flex", alignItems: "center", flexShrink: 0 }}>
      {isChecked
        ? <CheckSquare size={15} color={t.gold} />
        : <Square size={15} color={t.checkInactive} />}
    </button>
    <button onClick={onSelect}
      style={{ display: "flex", alignItems: "center", gap: "0.45rem", flex: 1,
               background: "none", border: "none", cursor: "pointer",
               padding: "0.45rem 0.5rem", textAlign: "left", fontFamily: "inherit", minWidth: 0 }}>
      {getFileIcon(file.name, 14, isActive ? t.fileActiveText : t.fileInactive)}
      <span style={{
        fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis",
        whiteSpace: "nowrap", flex: 1, letterSpacing: "0.01em",
        color: isActive ? t.fileActiveText : t.fileInactive,
      }}>{file.name}</span>
      {hasEvidence && <FileCheck size={11} color={t.green} style={{ flexShrink: 0 }} />}
    </button>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   InfoRow
───────────────────────────────────────────────────────────────────────────── */
const InfoRow = ({ label, value, t }: { label: React.ReactNode; value: string; t: Theme }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", padding: "0.5rem 1rem" }}>
    <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em",
                   textTransform: "uppercase" as const, color: t.evidenceKeyColor }}>{label}</span>
    <span style={{ fontSize: "0.82rem", color: t.textEvidence, lineHeight: "1.4" }}>{value}</span>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Global styles
───────────────────────────────────────────────────────────────────────────── */
function buildGlobalStyles(t: Theme): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
    html, body, #root {
      margin: 0; padding: 0; height: 100%; width: 100%;
      background-color: ${t.pageBg}; color: ${t.textPrimary};
      transition: background 0.25s, color 0.25s;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    * { box-sizing: border-box; }
    button { transition: opacity 0.15s; }
    button:hover { opacity: 0.82; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: ${t.scrollThumbHover}; }
  `;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────────── */
export const SecureSharePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const t = theme;

  const [files, setFiles]                       = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile]         = useState<FileItem | null>(null);
  const [selectedFiles, setSelectedFiles]       = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl]             = useState<string | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [downloadingCurrent, setDownloadingCurrent]   = useState(false);
  const [downloadingSelected, setDownloadingSelected] = useState(false);
  const [downloadingFolder, setDownloadingFolder]     = useState(false);
  const [expandedFolders, setExpandedFolders]   = useState<FolderState>({});
  const [isExpired, setIsExpired]               = useState(false);
  const [isAuthenticated, setIsAuthenticated]   = useState(false);
  const [isAccessDenied, setIsAccessDenied]     = useState(false);
  const [isAccessChecking, setIsAccessChecking] = useState(true);
  const [caseMetadata, setCaseMetadata]         = useState<Case | null>(null);
  const [evidenceMetadata, setEvidenceMetadata] = useState<Map<string, EvidenceItem>>(new Map());
  const warningShownRef = useRef(false);

  const prefix   = searchParams.get("prefix");
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const folderName = prefix?.split("/").filter(Boolean).pop() || "Shared Folder";

  /* ── Auth / expiry ── */
  useEffect(() => {
    setIsExpired(false); setPreviewUrl(null); warningShownRef.current = false;
  }, [prefix]);

  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = localStorage.getItem("external_token_expiry");
      if (!expiry) return;
      const timeLeft = parseInt(expiry) - Date.now();
      if (timeLeft <= 5000 && timeLeft > 0 && !warningShownRef.current) {
        warningShownRef.current = true;
        toast.error(`Session expiring in ${Math.ceil(timeLeft / 1000)}s`, { duration: 5000 });
      }
      if (timeLeft <= 0) {
        ["external_access_token", "external_token_expiry", "external_user_email"]
          .forEach((k) => localStorage.removeItem(k));
        setIsExpired(true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("external_access_token");
    const expiry = localStorage.getItem("external_token_expiry");
    if (!token || !expiry || Date.now() > parseInt(expiry)) {
      ["external_access_token", "external_token_expiry", "external_user_email"]
        .forEach((k) => localStorage.removeItem(k));
      navigate("/external-login", {
        state: { from: window.location.pathname + window.location.search }, replace: true,
      });
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  useEffect(() => {
    const validate = async () => {
      if (!isAuthenticated || !prefix) return;
      try {
        setIsAccessChecking(true);
        const token = localStorage.getItem("external_access_token");
        const res = await fetch(
          `${API_BASE}/external-share-info?prefix=${encodeURIComponent(prefix)}`,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        if (!res.ok) throw new Error("Access denied");
        setIsAccessDenied(false);
      } catch {
        ["external_access_token", "external_token_expiry", "external_user_email"]
          .forEach((k) => localStorage.removeItem(k));
        setIsAccessDenied(true);
      } finally {
        setIsAccessChecking(false);
      }
    };
    validate();
  }, [isAuthenticated, prefix]);

  /* ── Case number ── */
  const extractCaseNumber = (p: string | null) =>
    p?.match(/(\d{4}-\d{7})/)?.[1] ||
    p?.split("/").filter(Boolean).find((x) => /^\d{4}-\d{7}$/.test(x)) || null;
  const caseNumber = extractCaseNumber(prefix);

  /* ── Metadata ── */
  useEffect(() => {
    const fetch_ = async () => {
      if (!caseNumber || !isAuthenticated || !prefix) return;
      const token = localStorage.getItem("external_access_token");
      if (!token) return;
      try {
        const res = await fetch(
          `${API_BASE}/external-share-info?prefix=${encodeURIComponent(prefix)}`,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        if (res.ok) {
          const d = await res.json();
          setCaseMetadata({
            case_number: d.case_number || caseNumber, case_title: d.case_title || "",
            case_agents: d.case_agents || "", jurisdiction: d.jurisdiction || [],
            email: d.owner_email || "", user_name: d.owner || "",
            source_key: d.file || "", size: 0, shared_to: d.shared_to || [],
          });
        }
      } catch {}
      try {
        const res = await fetch(`${API_BASE}/cases/${caseNumber}/evidence`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (res.ok) {
          const d = await res.json();
          const map = new Map<string, EvidenceItem>();
          (d.items || []).forEach((e: EvidenceItem) => map.set(e.source_key, e));
          setEvidenceMetadata(map);
        }
      } catch {}
    };
    fetch_();
  }, [caseNumber, isAuthenticated, API_BASE, prefix]);

  /* ── Files ── */
  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !prefix) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("external_access_token");
        const res = await fetch(
          `${API_BASE}/external-list-objects?prefix=${encodeURIComponent(prefix)}&responseMode=grouped`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const merged = [...(data.folders || []), ...(data.files || [])];
        const normalized = merged.map((obj: any) => ({
          name: obj.path.split("/").filter(Boolean).pop(),
          key: obj.path, size: obj.size || 0,
          lastModified: obj.lastModified || null, type: obj.type,
        }));
        setFiles(normalized);
        setSelectedFile(normalized.find((f) => f.type === "file") || null);
        const folderNames = Object.keys(
          normalized.reduce((acc: Record<string, boolean>, item) => {
            if (item.type === "folder") {
              const parts = item.key.replace(prefix || "", "").split("/").filter(Boolean);
              if (parts.length > 0) acc[parts[0]] = true;
            }
            return acc;
          }, {})
        );
        setExpandedFolders(folderNames.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [isAuthenticated, prefix, API_BASE]);

  /* ── Preview ── */
  const generatePreview = async (file: FileItem) => {
    try {
      setPreviewUrl(null);
      const token = localStorage.getItem("external_access_token");
      const res = await fetch(`${API_BASE}/objects/generate-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "sign-single", objectKey: file.key }),
      });
      if (!res.ok) throw new Error("Failed");
      setPreviewUrl((await res.json()).url);
    } catch { toast.error("Failed to generate preview."); }
  };

  useEffect(() => {
    if (!selectedFile) return;
    setPreviewUrl(null);
    generatePreview(selectedFile);
  }, [selectedFile?.key]);

  /* ── Downloads ── */
  const downloadFromSignedUrl = async (url: string, name: string) => {
    const blob = await (await fetch(url)).blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: blobUrl, download: name });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  };

  const signedDownload = async (
    body: object,
    fileName: string,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("external_access_token");
      const res = await fetch(`${API_BASE}/objects/generate-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Link gen failed");
      await downloadFromSignedUrl((await res.json()).url, fileName);
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCurrent = () =>
    selectedFile &&
    signedDownload(
      { mode: "sign-single", objectKey: selectedFile.key },
      selectedFile.name,
      setDownloadingCurrent
    );

  const handleDownloadSelected = () =>
    selectedFiles.size > 0 &&
    signedDownload(
      { objectKeys: Array.from(selectedFiles) },
      "selected_files.zip",
      setDownloadingSelected
    );

  const handleDownloadFolder = () =>
    prefix &&
    signedDownload(
      { folderPrefix: prefix },
      `${folderName}.zip`,
      setDownloadingFolder
    );

  const toggleFileSelection = (key: string) => {
    setSelectedFiles((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  };

  /* ── Grouped file tree ── */
  const groupedFiles = files.reduce((acc: Record<string, FileItem[]>, item) => {
    const parts = item.key.replace(prefix || "", "").split("/").filter(Boolean);
    if (item.type === "folder") { if (!acc[parts[0]]) acc[parts[0]] = []; return acc; }
    const bucket = parts.length === 1 ? "_root" : parts[0];
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(item);
    return acc;
  }, {});

  /* ── Preview renderer ── */
  const cf: React.CSSProperties = { display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "1rem" };

  const renderPreview = () => {
    if (loading) return <div style={cf}><Spinner size={40} color={t.spinnerColor} /><p style={{ margin: 0, color: t.previewCaption, fontSize: "0.88rem" }}>Loading files…</p></div>;
    if (!selectedFile) return <div style={cf}><Eye size={56} color="#d1d5db" /><p style={{ margin: 0, color: t.previewCaption, fontSize: "0.88rem" }}>Select a file to preview</p></div>;
    if (!previewUrl) return <div style={cf}><Spinner size={40} color={t.spinnerColor} /><p style={{ margin: 0, color: t.previewCaption, fontSize: "0.88rem" }}>Generating secure preview…</p></div>;
    const fn = selectedFile.name.toLowerCase();
    if (fn.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/))
      return <img key={selectedFile.key} src={previewUrl} alt={selectedFile.name}
        style={{ maxWidth: "100%", maxHeight: "580px", objectFit: "contain", borderRadius: 6 }} />;
    if (fn.match(/\.(mp4|webm|ogg|avi|mov)$/))
      return <video key={selectedFile.key} controls style={{ maxWidth: "100%", maxHeight: 580, borderRadius: 8 }}><source src={previewUrl} /></video>;
    if (fn.match(/\.(mp3|wav|aac|flac|m4a)$/))
      return <div style={cf}><Music size={56} color={t.gold} /><audio key={selectedFile.key} controls style={{ width: "100%", maxWidth: 380 }}><source src={previewUrl} /></audio></div>;
    if (fn.endsWith(".pdf"))
      return <iframe key={selectedFile.key} src={previewUrl} style={{ width: "100%", height: 600, border: "none", borderRadius: 8 }} title={selectedFile.name} />;
    return <div style={cf}><FileText size={56} color="#d1d5db" /><p style={{ margin: 0, color: t.previewCaption, fontSize: "0.88rem" }}>No preview available</p><p style={{ margin: 0, color: t.previewCaption, fontSize: "0.78rem", opacity: 0.7 }}>Download the file to view it</p></div>;
  };

  const currentEvidence = selectedFile ? evidenceMetadata.get(selectedFile.key) ?? null : null;

  /* Shared button styles */
  const btnPrimary: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    padding: "0.45rem 1rem", fontSize: "0.8rem", fontWeight: 600,
    color: t.btnPrimaryText, backgroundColor: t.btnPrimaryBg,
    border: "none", borderRadius: "6px", cursor: "pointer",
    letterSpacing: "0.02em", fontFamily: "inherit",
  };
  const btnSecondary: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    padding: "0.45rem 1rem", fontSize: "0.8rem", fontWeight: 600,
    color: t.btnSecText, backgroundColor: t.btnSecBg,
    border: `1px solid ${t.btnSecBorder}`, borderRadius: "6px",
    cursor: "pointer", letterSpacing: "0.02em", fontFamily: "inherit",
  };

  /* ── Guard screens ── */
  if (isAccessChecking)
    return <OverlayScreen t={t} icon={<Spinner size={48} color={t.spinnerColor} />}
      title="Validating Access" message="Please wait while we verify your credentials…" />;
  if (isAccessDenied)
    return <OverlayScreen t={t} icon={<Lock size={48} color={t.gold} />}
      title="Access Denied"
      message="You do not have permission to view this shared content. Contact the case agent for access."
      action={<button style={btnPrimary} onClick={() => navigate("/external-login")}>Return to Login</button>} />;
  if (isExpired)
    return <OverlayScreen t={t} icon={<img src={logo} alt="Logo" style={{ height: 48, objectFit: "contain" }} />}
      title="Session Expired"
      message="Your access has expired. Please contact the file owner for a new link."
      action={<button style={btnPrimary} onClick={() => navigate("/external-login")}>Return to Login</button>} />;
  if (!isAuthenticated)
    return <OverlayScreen t={t} icon={<Spinner size={48} color={t.spinnerColor} />} title="" message="" />;

  /* ── Main UI ── */
  return (
    <>
      <style>{buildGlobalStyles(t)}</style>
      <div style={{
        display: "flex", flexDirection: "column",
        height: "100vh", minHeight: "100vh", width: "100%",
        overflow: "hidden", backgroundColor: t.pageBg,
        fontFamily: "'DM Sans', 'IBM Plex Sans', system-ui, sans-serif",
        color: t.textPrimary, transition: "background 0.25s, color 0.25s",
      }}>

        {/* ── Top Bar ── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 1.5rem", height: "58px",
          borderBottom: `1px solid ${t.topBarBorder}`,
          backgroundColor: t.surfaceBg, flexShrink: 0, gap: "1rem",
          transition: "background 0.25s, border 0.25s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", overflow: "hidden" }}>
            <img src={logo} alt="Logo" style={{ height: 30, objectFit: "contain" }} />
            <div style={{ width: 1, height: 22, backgroundColor: t.divider, flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflow: "hidden" }}>
              <Shield size={13} color={t.gold} />
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: t.textSecondary,
                             letterSpacing: "0.01em", overflow: "hidden",
                             textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {folderName}
              </span>
            </div>
            {caseNumber && (
              <span style={{
                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.07em",
                color: t.gold, backgroundColor: t.goldBg, border: `1px solid ${t.goldBorder}`,
                borderRadius: "4px", padding: "2px 8px", flexShrink: 0, fontVariantNumeric: "tabular-nums",
              }}>{caseNumber}</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
            {selectedFiles.size > 0 && (
              <button style={btnSecondary} onClick={handleDownloadSelected} disabled={downloadingSelected}>
                {downloadingSelected ? <Spinner size={14} color={t.gold} /> : <CheckSquare size={14} color={t.gold} />}
                Download Selected ({selectedFiles.size})
              </button>
            )}
            {files.length > 0 && (
              <button style={btnPrimary} onClick={handleDownloadFolder} disabled={downloadingFolder}>
                {downloadingFolder ? <Spinner size={14} color={t.btnPrimaryText} /> : <Archive size={14} />}
                Download Case Folder
              </button>
            )}
          </div>
        </header>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Sidebar ── */}
          <aside style={{
            width: "310px", flexShrink: 0, display: "flex", flexDirection: "column",
            borderRight: `1px solid ${t.border}`, backgroundColor: t.sidebarBg,
            overflow: "auto", transition: "background 0.25s, border 0.25s",
          }}>
            {caseMetadata && (
              <div style={{ borderBottom: `1px solid ${t.border}`, padding: "1rem",
                            backgroundColor: t.casePanelBg, transition: "background 0.25s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.875rem" }}>
                  <Briefcase size={13} color={t.gold} />
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
                                 textTransform: "uppercase", color: t.caseLabelColor }}>
                    Case Information
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {caseMetadata.case_title && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span style={{ color: t.caseKeyColor, fontWeight: 600, minWidth: "80px",
                                     fontSize: "0.72rem", letterSpacing: "0.02em",
                                     textTransform: "uppercase", flexShrink: 0 }}>Title</span>
                      <span style={{ color: t.caseValColor, lineHeight: "1.4", fontSize: "0.82rem" }}>
                        {caseMetadata.case_title}
                      </span>
                    </div>
                  )}
                  {caseMetadata.jurisdiction && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span style={{ display: "flex", alignItems: "center", color: t.caseKeyColor,
                                     fontWeight: 600, minWidth: "80px", fontSize: "0.72rem",
                                     letterSpacing: "0.02em", textTransform: "uppercase", flexShrink: 0 }}>
                        <MapPin size={10} style={{ marginRight: 3 }} />Jurisdiction
                      </span>
                      <span style={{ color: t.caseValColor, fontSize: "0.82rem" }}>
                        {Array.isArray(caseMetadata.jurisdiction)
                          ? caseMetadata.jurisdiction.join(", ") : caseMetadata.jurisdiction}
                      </span>
                    </div>
                  )}
                  {caseMetadata.case_agents && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span style={{ display: "flex", alignItems: "center", color: t.caseKeyColor,
                                     fontWeight: 600, minWidth: "80px", fontSize: "0.72rem",
                                     letterSpacing: "0.02em", textTransform: "uppercase", flexShrink: 0 }}>
                        <Users size={10} style={{ marginRight: 3 }} />Agents
                      </span>
                      <span style={{ color: t.caseValColor, fontSize: "0.82rem" }}>{caseMetadata.case_agents}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File tree */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "1rem 1rem 0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
                               textTransform: "uppercase", color: t.gold }}>Files</span>
                <span style={{ fontSize: "0.68rem", color: t.textTiny, fontWeight: 600, letterSpacing: "0.04em" }}>
                  {files.filter((f) => f.type === "file").length} items
                </span>
              </div>

              {loading ? (
                <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
                  <Spinner color={t.spinnerColor} />
                </div>
              ) : files.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                              gap: "0.75rem", padding: "3rem 1rem" }}>
                  <FileText size={36} color={t.emptyIconColor} />
                  <p style={{ color: t.emptyTextColor, fontSize: "0.82rem", margin: 0 }}>No files available</p>
                </div>
              ) : (
                <div style={{ padding: "0.5rem 0" }}>
                  {Object.entries(groupedFiles).map(([folder, folderFiles]) => {
                    const isRoot = folder === "_root";
                    const isExp  = expandedFolders[folder];
                    if (isRoot) return folderFiles.map((file) => (
                      <FileRow key={file.key} file={file} t={t}
                        isActive={selectedFile?.key === file.key}
                        isChecked={selectedFiles.has(file.key)}
                        hasEvidence={evidenceMetadata.has(file.key)}
                        onSelect={() => setSelectedFile(file)}
                        onToggle={() => toggleFileSelection(file.key)} />
                    ));
                    return (
                      <div key={folder}>
                        <button style={{ display: "flex", alignItems: "center", gap: "0.45rem",
                                         padding: "0.5rem 1rem", background: "none", border: "none",
                                         cursor: "pointer", width: "100%", fontFamily: "inherit" }}
                          onClick={() => setExpandedFolders((p) => ({ ...p, [folder]: !p[folder] }))}>
                          {isExp ? <ChevronDown size={13} color={t.chevron} /> : <ChevronRight size={13} color={t.chevron} />}
                          <Folder size={14} color={t.gold} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: "0.82rem", fontWeight: 600,
                                         color: t.folderName, letterSpacing: "0.02em" }}>{folder}</span>
                        </button>
                        {isExp && (
                          <div style={{ paddingLeft: "1.25rem" }}>
                            {folderFiles.map((file) => (
                              <FileRow key={file.key} file={file} t={t}
                                isActive={selectedFile?.key === file.key}
                                isChecked={selectedFiles.has(file.key)}
                                hasEvidence={evidenceMetadata.has(file.key)}
                                onSelect={() => file.type === "file" && setSelectedFile(file)}
                                onToggle={() => toggleFileSelection(file.key)} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* ── Main content ── */}
          <main style={{ flex: 1, overflow: "auto", padding: "1.5rem",
                         display: "flex", flexDirection: "column", gap: "1.25rem",
                         backgroundColor: t.pageBg, transition: "background 0.25s" }}>
            {selectedFile && (
              <div style={{ display: "flex", alignItems: "center",
                            justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", overflow: "hidden" }}>
                  {getFileIcon(selectedFile.name, 18, t.gold)}
                  <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: t.textPrimary,
                               overflow: "hidden", textOverflow: "ellipsis",
                               whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
                    {selectedFile.name}
                  </h2>
                </div>
                <button style={btnPrimary} onClick={handleDownloadCurrent} disabled={downloadingCurrent}>
                  {downloadingCurrent ? <Spinner size={14} color={t.btnPrimaryText} /> : <Download size={14} />}
                  Download
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "1.25rem", flex: 1, alignItems: "flex-start" }}>
              {/* Preview card — always white so images display correctly */}
              <div style={{ flex: 1, minHeight: "520px", backgroundColor: "#ffffff",
                            border: `1px solid ${t.border}`, borderRadius: "10px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            overflow: "hidden", padding: "1.5rem",
                            transition: "border 0.25s" }}>
                {renderPreview()}
              </div>

              {/* Info panel */}
{selectedFile && (
  <div
    style={{
      width: "280px",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    }}
  >
    {currentEvidence && (
      <div
        style={{
          backgroundColor: t.evidenceCardBg,
          border: `1px solid ${t.evidenceBorder}`,
          borderRadius: "10px",
          overflow: "hidden",
          transition: "background 0.25s",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            borderBottom: `1px solid ${t.evidenceBorder}`,
          }}
        >
          <FileCheck size={14} color={t.green} />
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: t.evidenceLabelColor,
            }}
          >
            Evidence Record
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "0.5rem 0" }}>
          <InfoRow t={t} label="Evidence No." value={currentEvidence.evidence_number} />
          {currentEvidence.description && (
            <InfoRow t={t} label="Description" value={currentEvidence.description} />
          )}
          <InfoRow t={t} label="Uploaded" value={formatDate(currentEvidence.uploaded_at)} />
        </div>
      </div>
    )}

    {/* File Details — now styled the same as Evidence Record */}
    <div
      style={{
        backgroundColor: t.evidenceCardBg,          // match Evidence Record
        border: `1px solid ${t.evidenceBorder}`,     // match Evidence Record
        borderRadius: "10px",
        overflow: "hidden",
        transition: "background 0.25s, border 0.25s",
      }}
    >
      {/* Header strip matches Evidence Record format */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          borderBottom: `1px solid ${t.evidenceBorder}`,
        }}
      >
        <HardDrive size={14} color={t.green} />
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: t.evidenceLabelColor, // consistent header label color
          }}
        >
          File Details
        </span>
      </div>

      {/* Body uses InfoRow rows to mirror Evidence Record spacing and density */}
      <div style={{ display: "flex", flexDirection: "column", padding: "0.5rem 0" }}>
        {/* Size */}
        <InfoRow
          t={t}
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <HardDrive size={13} color={t.metaKey} />
              <span>Size</span>
            </span>
          }
          value={formatFileSize(selectedFile.size)}
        />

        {/* Type */}
        <InfoRow
          t={t}
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              {getFileIcon(selectedFile.name, 13, t.metaKey)}
              <span>Type</span>
            </span>
          }
          value={selectedFile.name.split(".").pop()?.toUpperCase() || "—"}
        />

        {/* Modified (optional) */}
        {selectedFile.lastModified ? (
          <InfoRow
            t={t}
            label={
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <Clock size={13} color={t.metaKey} />
                <span>Modified</span>
              </span>
            }
            value={formatDate(selectedFile.lastModified)}
          />
        ) : null}
      </div>
    </div>
  </div>
)}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};