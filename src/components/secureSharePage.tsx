import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Flex,
  Loader,
  Heading,
  Text,
  Button,
  Divider,
  Card,
  Badge,
} from "@aws-amplify/ui-react";
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
  Hash,
  FileCheck,
  CheckSquare,
  Square,
  Briefcase,
  Users,
  MapPin,
} from "lucide-react";
import { Case, EvidenceItem } from "../api/cases/cases.types";
import logo from "../assets/logo.png";

type FileItem = {
  name: string;
  key: string;
  size: number;
  lastModified: string | null;
  type: "file" | "folder";
};

type FolderState = {
  [key: string]: boolean;
};

export const SecureSharePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<FolderState>({});
  const [isExpired, setIsExpired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [isAccessChecking, setIsAccessChecking] = useState(true);

  // Case and Evidence metadata
  const [caseMetadata, setCaseMetadata] = useState<Case | null>(null);
  const [evidenceMetadata, setEvidenceMetadata] = useState<Map<string, EvidenceItem>>(new Map());
  // const [metadataLoading, setMetadataLoading] = useState(false);

  // 🔐 Track if expiration warning was shown
  const warningShownRef = useRef(false);

  const prefix = searchParams.get("prefix");
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const folderName = prefix?.split("/").filter(Boolean).pop() || "Shared Folder";
  
  // Reset expired state when prefix changes (new link)
  useEffect(() => {
    setIsExpired(false);
    setPreviewUrl(null);
    warningShownRef.current = false;
  }, [prefix]);
  
  // 🔐 Monitor token expiration and force logout
  useEffect(() => {
    const monitorExpiration = () => {
      const expiry = localStorage.getItem('external_token_expiry');
      if (!expiry) return;

      const expiryTime = parseInt(expiry);
      const now = Date.now();
      const timeLeft = expiryTime - now;

      // Show warning 5 seconds before expiry
      if (timeLeft <= 5000 && timeLeft > 0 && !warningShownRef.current) {
        warningShownRef.current = true;
        toast.error(
          <div>
            <strong>⚠️ Session expiring soon!</strong>
            <br />
            <span style={{ fontSize: "0.85em" }}>
              Your access will expire in {Math.ceil(timeLeft / 1000)} seconds
            </span>
          </div>,
          { duration: 5000 }
        );
      }

      // Force logout on expiry
      if (timeLeft <= 0) {
        console.log("🔒 Session expired - forcing logout");
        
        // Clear all external auth data
        localStorage.removeItem('external_access_token');
        localStorage.removeItem('external_token_expiry');
        localStorage.removeItem('external_user_email');
        
        // Set expired state to show full-screen message
        setIsExpired(true);
      }
    };

    // Check every 500ms for precise timing
    const interval = setInterval(monitorExpiration, 500);
    return () => clearInterval(interval);
  }, [navigate]);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('external_access_token');
        const expiry = localStorage.getItem('external_token_expiry');
        
        if (!token || !expiry) {
          throw new Error('No session');
        }
        
        if (Date.now() > parseInt(expiry)) {
          localStorage.removeItem('external_access_token');
          localStorage.removeItem('external_token_expiry');
          localStorage.removeItem('external_user_email');
          throw new Error('Session expired');
        }
        
        setIsAuthenticated(true);
      } catch {
        navigate('/external-login', {
          state: { from: window.location.pathname + window.location.search },
          replace: true,
        });
      }
    };
    
    checkAuth();
  }, [navigate]);

  // 🔐 Validate share access before loading content
useEffect(() => {
  const validateAccess = async () => {
    if (!isAuthenticated || !prefix) return;

    try {
      setIsAccessChecking(true);

      const token = localStorage.getItem("external_access_token");

      const res = await fetch(
        `${API_BASE}/external-share-info?prefix=${encodeURIComponent(prefix)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Access denied");
      }

      setIsAccessDenied(false);
    } catch (err) {
      console.error("Access validation failed:", err);

      // Clear session immediately
      localStorage.removeItem("external_access_token");
      localStorage.removeItem("external_token_expiry");
      localStorage.removeItem("external_user_email");

      setIsAccessDenied(true);
    } finally {
      setIsAccessChecking(false);
    }
  };

  validateAccess();
}, [isAuthenticated, prefix]);

  
  // Extract case number from prefix
  const extractCaseNumber = (prefixStr: string | null): string | null => {
    if (!prefixStr) return null;
    
    const match = prefixStr.match(/(\d{4}-\d{7})/);
    if (match) {
      return match[1];
    }
    
    const parts = prefixStr.split("/").filter(Boolean);
    const caseNum = parts.find(part => /^\d{4}-\d{7}$/.test(part));
    return caseNum || null;
  };
  
  const caseNumber = extractCaseNumber(prefix);

  // Helper Functions
  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/))
      return <Image size={16} />;
    if (lower.match(/\.(mp4|webm|ogg|avi|mov)$/))
      return <Film size={16} />;
    if (lower.match(/\.(mp3|wav|aac|flac|m4a)$/))
      return <Music size={16} />;
    if (lower.match(/\.(pdf|txt|csv|log|json|xml|html|css|js|ts|tsx)$/))
      return <FileCode size={16} />;
    return <FileText size={16} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  // Group files by first-level folder
  const groupedFiles = files.reduce((acc, item) => {
    const relativePath = item.key.replace(prefix || "", "");
    const parts = relativePath.split("/").filter(Boolean);

    if (item.type === "folder") {
      const folderName = parts[0];
      if (!acc[folderName]) acc[folderName] = [];
      return acc;
    }

    if (parts.length === 1) {
      if (!acc["_root"]) acc["_root"] = [];
      acc["_root"].push(item);
    } else {
      const folderName = parts[0];
      if (!acc[folderName]) acc[folderName] = [];
      acc[folderName].push(item);
    }

    return acc;
  }, {} as Record<string, FileItem[]>);

  // 🔧 FIX: Fetch Case and Evidence Metadata from share record
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!caseNumber || !isAuthenticated || !prefix) {
        console.log("Skipping metadata fetch - caseNumber:", caseNumber, "isAuthenticated:", isAuthenticated);
        return;
      }

      try {
        // setMetadataLoading(true);
        console.log("Fetching metadata for case:", caseNumber);

        const token = localStorage.getItem('external_access_token');
        const email = localStorage.getItem('external_user_email');
        
        if (!token || !email) {
          console.log("No external token or email available");
          return;
        }

        // 🔧 FIX: Get case metadata from the external share record
        try {
          console.log("Fetching share data for email:", email, "and prefix:", prefix);
          const res = await fetch(`${API_BASE}/external-share-info?email=${encodeURIComponent(email)}&prefix=${encodeURIComponent(prefix)}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
          
          if (res.ok) {
            const shareData = await res.json();
            console.log("Share data received:", shareData);
            
            // Extract case metadata from share record
            if (shareData) {
              const caseData: Case = {
                case_number: shareData.case_number || caseNumber,
                case_title: shareData.case_title || '',
                case_agents: shareData.case_agents || '',
                jurisdiction: shareData.jurisdiction || [],
                email: shareData.owner_email || '',
                user_name: shareData.owner || '',
                source_key: shareData.file || '',
                size: 0,
                shared_to: shareData.shared_to || [],
              };
              setCaseMetadata(caseData);
            }
          } else {
            console.log("Could not fetch share info:", res.status);
          }
        } catch (caseErr: any) {
          console.log("Error fetching share info:", caseErr.message);
        }

        // 🔧 FIX: Fetch evidence metadata using external token
        try {
          console.log("Fetching evidence for case:", caseNumber);
          const res = await fetch(`${API_BASE}/cases/${caseNumber}/evidence`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
          
          if (res.ok) {
            const evidenceResponse = await res.json();
            console.log("Evidence response:", evidenceResponse);
            
            const evidenceMap = new Map<string, EvidenceItem>();
            
            if (evidenceResponse.items && evidenceResponse.items.length > 0) {
              evidenceResponse.items.forEach((evidence: EvidenceItem) => {
                console.log("Processing evidence:", evidence.evidence_number, "Key:", evidence.s3_key);
                evidenceMap.set(evidence.s3_key, evidence);
              });
              console.log("Evidence map created with", evidenceMap.size, "items");
            }
            
            setEvidenceMetadata(evidenceMap);
          } else {
            console.log("Could not fetch evidence metadata:", res.status);
          }
        } catch (evidErr: any) {
          console.log("Error fetching evidence metadata:", evidErr.message);
        }
        
      } catch (err) {
        console.error("Error fetching metadata:", err);
      } finally {
        // setMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, [caseNumber, isAuthenticated, API_BASE]);

  // Fetch files
  useEffect(() => {
    const fetchFiles = async () => {
      if (!isAuthenticated || !prefix) return;

      try {
        setLoading(true);

        const token = localStorage.getItem('external_access_token');

        const res = await fetch(
          `${API_BASE}/list-s3-objects?prefix=${encodeURIComponent(prefix)}&responseMode=grouped`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
                const merged = [
          ...(data.folders || []),
          ...(data.files || []),
        ];
        const normalized = merged.map((obj: any) => ({
          name: obj.path.split("/").filter(Boolean).pop(),
          key: obj.path,
          size: obj.size || 0,
          lastModified: obj.lastModified || null,
          type: obj.type,
        }));

        setFiles(normalized);

        // Clear expired cache entries on page load
        const now = Date.now();
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('preview_')) {
            try {
              const cached = JSON.parse(localStorage.getItem(key) || '{}');
              if (cached.expiry && now > cached.expiry) {
                localStorage.removeItem(key);
              }
            } catch (e) {
              localStorage.removeItem(key);
            }
          }
        });

        // Auto select first file only
        const firstFile = normalized.find((f) => f.type === "file");
        setSelectedFile(firstFile || null);

        // Auto-expand all folders
        const folders = Object.keys(
          normalized.reduce((acc, item) => {
            if (item.type === "folder") {
              const relativePath = item.key.replace(prefix || "", "");
              const parts = relativePath.split("/").filter(Boolean);
              if (parts.length > 0) acc[parts[0]] = true;
            }
            return acc;
          }, {} as Record<string, boolean>)
        );

        setExpandedFolders(
          folders.reduce((acc, f) => ({ ...acc, [f]: true }), {})
        );
      } catch (err) {
        console.error("Error fetching files:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [isAuthenticated, prefix, API_BASE]);

  // Generate signed preview URL (using existing endpoint with external token)
  const generatePreview = async (file: FileItem) => {
    try {
      const token = localStorage.getItem('external_access_token');

      const res = await fetch(`${API_BASE}/objects/generate-link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "sign-single",
          objectKey: file.key,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Preview generation failed:", res.status, errorText);
        throw new Error(`Failed to generate preview: ${res.status}`);
      }

      const data = await res.json();

      // Handle timestamps safely
      const generatedAt = data.generatedAt ? data.generatedAt * 1000 : Date.now();
      const expiresIn = data.expiresIn || 120;
      const expiry = generatedAt + (expiresIn * 1000);

      console.log("Generated at:", new Date(generatedAt).toISOString());
      console.log("Expires at:", new Date(expiry).toISOString());

      const cacheKey = `preview_${file.key}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ url: data.url, expiry })
      );

      setPreviewUrl(data.url);

    } catch (err) {
      console.error("Error generating preview:", err);
      toast.error("Failed to generate preview. Please try refreshing.");
    }
  };

  // 🔧 FIX: Check if preview URL is expired - only clear, don't regenerate
  const checkPreviewExpiration = () => {
    if (!selectedFile) return;
    
    const cacheKey = `preview_${selectedFile.key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return;
    }
    
    try {
      const { expiry } = JSON.parse(cached);
      if (Date.now() > expiry) {
        // Just clear the preview URL and cache, don't regenerate
        setPreviewUrl(null);
        localStorage.removeItem(cacheKey);
        setIsPreviewExpired(true);
      }
    } catch {
      // Invalid cache, just clear it
      localStorage.removeItem(cacheKey);
      setPreviewUrl(null);
      setIsPreviewExpired(true);
    }
  };

  // Check preview expiration every second
  useEffect(() => {
    const interval = setInterval(checkPreviewExpiration, 1000);
    return () => clearInterval(interval);
  }, [selectedFile]);

  // Load cached preview URL when file is selected
  useEffect(() => {
    if (!selectedFile) return;

    // Reset preview expired state when selecting a new file
    setIsPreviewExpired(false);

    const cacheKey = `preview_${selectedFile.key}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const { url, expiry } = JSON.parse(cached);
        if (Date.now() < expiry) {
          setPreviewUrl(url);
        } else {
          // Expired - just show expired message
          setPreviewUrl(null);
          localStorage.removeItem(cacheKey);
          setIsPreviewExpired(true);
        }
      } catch {
        // Invalid cache - show expired message
        localStorage.removeItem(cacheKey);
        setPreviewUrl(null);
        setIsPreviewExpired(true);
      }
    } else {
      // No cached preview - generate once
      generatePreview(selectedFile);
    }
  }, [selectedFile]);

  const getEvidenceForFile = (fileKey: string): EvidenceItem | null => {
    return evidenceMetadata.get(fileKey) || null;
  };

  // 🔧 FIX: Download Functions - Generate new signed URL for download
  const handleDownloadCurrent = async () => {
    if (!selectedFile) return;
    
    setDownloading(true);
    try {
      const token = localStorage.getItem('external_access_token');
      
      // Generate a fresh signed URL for download
      const res = await fetch(`${API_BASE}/objects/generate-link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "sign-single",
          objectKey: selectedFile.key,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate download link: ${res.status}`);
      }

      const data = await res.json();
      
      // Create download link
      const link = document.createElement('a');
      link.href = data.url;
      link.download = selectedFile.name;
      link.setAttribute('download', selectedFile.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const toggleFileSelection = (key: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Check if preview link is expired
  const [isPreviewExpired, setIsPreviewExpired] = useState(false);

  // Render preview based on file type
  const renderPreview = () => {
    if (loading) {
      return (
        <Flex direction="column" alignItems="center" gap="1rem">
          <Loader size="large" />
          <Text color="#6b7280">Loading files...</Text>
        </Flex>
      );
    }

    if (!selectedFile) {
      return (
        <Flex direction="column" alignItems="center" gap="1rem">
          <FileText size={64} color="#d1d5db" />
          <Text color="#9ca3af" fontSize="1rem">
            Select a file to preview
          </Text>
        </Flex>
      );
    }

    if (!previewUrl) {
      return (
        <Flex direction="column" alignItems="center" gap="1rem">
          <Loader size="large" />
          <Text color="#6b7280">Generating secure preview...</Text>
        </Flex>
      );
    }

    const fileName = selectedFile.name.toLowerCase();

    // Image preview
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) {
      return (
        <img
          src={previewUrl}
          alt={selectedFile.name}
          style={{
            maxWidth: "100%",
            maxHeight: "600px",
            objectFit: "contain",
            borderRadius: "8px",
          }}
        />
      );
    }

    // Video preview
    if (fileName.match(/\.(mp4|webm|ogg|avi|mov)$/)) {
      return (
        <video
          controls
          style={{
            maxWidth: "100%",
            maxHeight: "600px",
            borderRadius: "8px",
          }}
        >
          <source src={previewUrl} />
          Your browser does not support video playback.
        </video>
      );
    }

    // Audio preview
    if (fileName.match(/\.(mp3|wav|aac|flac|m4a)$/)) {
      return (
        <Flex direction="column" alignItems="center" gap="2rem" padding="2rem">
          <Music size={64} color="#6b7280" />
          <audio controls style={{ width: "100%", maxWidth: "400px" }}>
            <source src={previewUrl} />
            Your browser does not support audio playback.
          </audio>
        </Flex>
      );
    }

    // PDF preview
    if (fileName.endsWith(".pdf")) {
      return (
        <iframe
          src={previewUrl}
          style={{
            width: "100%",
            height: "600px",
            border: "none",
            borderRadius: "8px",
          }}
          title={selectedFile.name}
        />
      );
    }

    // Default - no preview available
    return (
      <Flex direction="column" alignItems="center" gap="1rem">
        <FileText size={64} color="#d1d5db" />
        <Text color="#9ca3af" fontSize="1rem">
          Preview not available for this file type
        </Text>
        <Text color="#9ca3af" fontSize="0.875rem">
          Click the download button to view this file
        </Text>
      </Flex>
    );
  };

  const currentEvidence = selectedFile ? getEvidenceForFile(selectedFile.key) : null;
  if (isAccessChecking) {
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      style={{ height: "100vh" }}
    >
      <Loader size="large" />
      <Text>Validating access...</Text>
    </Flex>
  );
}
if (isAccessDenied) {
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      style={{
        height: "100vh",
        backgroundColor: "#f9fafb",
        padding: "2rem",
      }}
    >
      <Card
        variation="outlined"
        style={{
          maxWidth: "500px",
          padding: "3rem",
          textAlign: "center",
        }}
      >
        <Flex direction="column" gap="1.5rem" alignItems="center">
          <img
            src={logo}
            alt="Logo"
            style={{
              height: "64px",
              objectFit: "contain",
            }}
          />
          <Heading level={3} style={{ margin: 0 }}>
            Access Denied
          </Heading>
          <Text color="#6b7280">
            You do not have permission to access this shared content.
          </Text>
          <Button
            variation="primary"
            onClick={() => navigate("/external-login")}
          >
            Return to Login
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}

  // Full-screen expiration message
  if (isExpired) {
    return (
      <Flex
        direction="column"
        justifyContent="center"
        alignItems="center"
        style={{
          height: "100vh",
          backgroundColor: "#f9fafb",
          padding: "2rem",
        }}
      >
        <Card
          variation="outlined"
          style={{
            maxWidth: "500px",
            padding: "3rem",
            textAlign: "center",
          }}
        >
          <Flex direction="column" gap="1.5rem" alignItems="center">
            <div style={{ fontSize: "4rem" }}>🔒</div>
            <Heading level={3} style={{ margin: 0 }}>
              Session Expired
            </Heading>
            <Text color="#6b7280">
              Your access to this shared content has expired. Please contact the file owner for a new link.
            </Text>
            <Button
              variation="primary"
              onClick={() => {
                navigate('/external-login');
              }}
            >
              Return to Login
            </Button>
          </Flex>
        </Card>
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Loader size="large" />;
  }

  return (
    <Flex direction="column" style={{ height: "100vh", overflow: "hidden", position: "relative" }}>
      {/* HEADER */}
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        padding="1.25rem 2rem"
        style={{
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          flexShrink: 0,
        }}
      >
        <Flex alignItems="center" gap="1rem">
          <img
            src={logo}
            alt="Logo"
            style={{ height: "36px", objectFit: "contain" }}
          />
          <Divider orientation="vertical" style={{ height: "24px" }} />
          <Heading level={5} style={{ margin: 0, color: "#111827" }}>
            {folderName}
          </Heading>
        </Flex>

        <Flex gap="1rem" alignItems="center">
          {caseNumber && (
            <Badge variation="info" size="small">
              <Flex gap="0.5rem" alignItems="center">
                <Hash size={14} />
                {caseNumber}
              </Flex>
            </Badge>
          )}
        </Flex>
      </Flex>

      {/* MAIN CONTENT */}
      <Flex flex="1" style={{ overflow: "hidden" }}>
        {/* LEFT PANEL - File List */}
        <Flex
          direction="column"
          style={{
            width: "320px",
            borderRight: "1px solid #e5e7eb",
            overflow: "auto",
            backgroundColor: "#f9fafb",
            flexShrink: 0,
          }}
        >
          <Flex
            direction="column"
            padding="1.5rem"
            gap="0.5rem"
            style={{
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
            }}
          >
            <Heading level={6} style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280", fontWeight: 600 }}>
              FILES ({files.length})
            </Heading>
          </Flex>

          {/* Case Metadata Panel */}
          {caseMetadata && (
            <Flex
              direction="column"
              padding="1rem"
              gap="0.75rem"
              style={{
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#fefce8",
              }}
            >
              <Flex gap="0.5rem" alignItems="center">
                <Briefcase size={16} color="#ca8a04" />
                <Text fontSize="0.75rem" color="#854d0e" fontWeight={600} style={{ letterSpacing: "0.5px" }}>
                  CASE INFORMATION
                </Text>
              </Flex>
              
              <Flex direction="column" gap="0.5rem">
                {caseMetadata.case_title && (
                  <Flex direction="column" gap="0.25rem">
                    <Text fontSize="0.7rem" color="#a16207" fontWeight={600}>
                      Title
                    </Text>
                    <Text fontSize="0.85rem" color="#854d0e" style={{ fontWeight: 500 }}>
                      {caseMetadata.case_title}
                    </Text>
                  </Flex>
                )}
                
                {caseMetadata.jurisdiction && (
                  <Flex direction="column" gap="0.25rem">
                    <Flex gap="0.25rem" alignItems="center">
                      <MapPin size={12} color="#a16207" />
                      <Text fontSize="0.7rem" color="#a16207" fontWeight={600}>
                        Jurisdiction
                      </Text>
                    </Flex>
                    <Text fontSize="0.85rem" color="#854d0e" style={{ fontWeight: 500 }}>
                      {Array.isArray(caseMetadata.jurisdiction) 
                        ? caseMetadata.jurisdiction.join(", ") 
                        : caseMetadata.jurisdiction}
                    </Text>
                  </Flex>
                )}
                
                {caseMetadata.case_agents && (
                  <Flex direction="column" gap="0.25rem">
                    <Flex gap="0.25rem" alignItems="center">
                      <Users size={12} color="#a16207" />
                      <Text fontSize="0.7rem" color="#a16207" fontWeight={600}>
                        Agents
                      </Text>
                    </Flex>
                    <Text fontSize="0.85rem" color="#854d0e" style={{ fontWeight: 500 }}>
                      {caseMetadata.case_agents}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          )}

          <Flex direction="column" gap="0.25rem" padding="1rem">
            {Object.entries(groupedFiles).map(([folderName, folderFiles]) => {
              const isRoot = folderName === "_root";
              const isExpanded = expandedFolders[folderName];

              if (isRoot) {
                return folderFiles.map((file) => {
                  const isSelected = selectedFiles.has(file.key);
                  const hasEvidence = evidenceMetadata.has(file.key);
                  return (
                    <Flex key={file.key} alignItems="center" gap="0.5rem">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(file.key);
                        }}
                        style={{ cursor: "pointer", padding: "0.25rem" }}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} color="#2563eb" />
                        ) : (
                          <Square size={18} color="#9ca3af" />
                        )}
                      </div>
                      <Button
                        variation={selectedFile?.key === file.key ? "primary" : "link"}
                        onClick={() => setSelectedFile(file)}
                        style={{
                          justifyContent: "flex-start",
                          padding: "0.625rem 0.75rem",
                          fontSize: "0.875rem",
                          transition: "all 0.2s ease",
                          flex: 1,
                        }}
                      >
                        <Flex gap="0.5rem" alignItems="center" width="100%">
                          {getFileIcon(file.name)}
                          <Text
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            {file.name}
                          </Text>
                          {hasEvidence && (
                            <FileCheck size={14} color="#10b981" />
                          )}
                        </Flex>
                      </Button>
                    </Flex>
                  );
                });
              }

              return (
                <div key={folderName}>
                  <Button
                    variation="link"
                    onClick={() => toggleFolder(folderName)}
                    style={{
                      justifyContent: "flex-start",
                      padding: "0.625rem 0.75rem",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#374151",
                      width: "100%",
                    }}
                  >
                    <Flex gap="0.5rem" alignItems="center">
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <Folder size={16} />
                      <Text>{folderName}</Text>
                    </Flex>
                  </Button>

                  {isExpanded && (
                    <div style={{ paddingLeft: "1.5rem" }}>
                      {folderFiles.map((file) => {
                        const isSelected = selectedFiles.has(file.key);
                        const hasEvidence = evidenceMetadata.has(file.key);
                        return (
                          <Flex key={file.key} alignItems="center" gap="0.5rem">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFileSelection(file.key);
                              }}
                              style={{ cursor: "pointer", padding: "0.25rem" }}
                            >
                              {isSelected ? (
                                <CheckSquare size={18} color="#2563eb" />
                              ) : (
                                <Square size={18} color="#9ca3af" />
                              )}
                            </div>
                            <Button
                              variation={selectedFile?.key === file.key ? "primary" : "link"}
                              onClick={() => {
                                if (file.type === "file") {
                                  setSelectedFile(file);
                                }
                              }}
                              style={{
                                justifyContent: "flex-start",
                                padding: "0.625rem 0.75rem",
                                fontSize: "0.875rem",
                                transition: "all 0.2s ease",
                                flex: 1,
                              }}
                            >
                              <Flex gap="0.5rem" alignItems="center" width="100%">
                                {getFileIcon(file.name)}
                                <Text
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                  }}
                                >
                                  {file.name}
                                </Text>
                                {hasEvidence && (
                                  <FileCheck size={14} color="#10b981" />
                                )}
                              </Flex>
                            </Button>
                          </Flex>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </Flex>

          {files.length === 0 && (
            <Flex direction="column" alignItems="center" gap="0.5rem" padding="2rem 1rem">
              <FileText size={48} color="#d1d5db" />
              <Text color="#9ca3af" fontSize="0.875rem">
                No files available
              </Text>
            </Flex>
          )}
        </Flex>

        {/* RIGHT PANEL - Preview & Metadata */}
        <Flex direction="column" flex="1" style={{ overflow: "hidden" }}>
          <Flex flex="1" style={{ overflow: "auto", padding: "2rem" }}>
            <Flex direction="column" flex="1" gap="1.5rem" style={{ maxWidth: "1200px", margin: "0 auto" }}>
              {selectedFile && (
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading level={4} style={{ margin: 0 }}>
                    {selectedFile.name}
                  </Heading>
                  <Button
                    variation="primary"
                    onClick={handleDownloadCurrent}
                    isLoading={downloading}
                  >
                    <Flex gap="0.5rem" alignItems="center">
                      <Download size={16} />
                      Download
                    </Flex>
                  </Button>
                </Flex>
              )}

              <Flex gap="1.5rem" direction={{ base: "column", large: "row" }}>
                {/* Preview Area */}
                <Card
                  variation="outlined"
                  style={{
                    flex: 1,
                    padding: "2rem",
                    backgroundColor: "#ffffff",
                    minHeight: "500px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {renderPreview()}
                </Card>

                {/* Metadata Panel */}
                {selectedFile && (
                  <Card
                    variation="outlined"
                    style={{
                      width: "320px",
                      padding: "1.5rem",
                      backgroundColor: "#ffffff",
                      alignSelf: "flex-start",
                    }}
                  >
                    <Flex direction="column" gap="1.5rem">
                      <Heading level={5} style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                        File Information
                      </Heading>

                      <Divider style={{ margin: 0 }} />

                      {/* Evidence Metadata Section */}
                      {currentEvidence && (
                        <>
                          <Flex direction="column" gap="1rem" padding="1rem" style={{ backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #86efac" }}>
                            <Flex gap="0.5rem" alignItems="center">
                              <FileCheck size={18} color="#10b981" />
                              <Text fontSize="0.8rem" color="#065f46" fontWeight={600} style={{ letterSpacing: "0.5px" }}>
                                EVIDENCE INFORMATION
                              </Text>
                            </Flex>
                            
                            <Flex direction="column" gap="0.75rem">
                              <Flex direction="column" gap="0.25rem">
                                <Text fontSize="0.75rem" color="#047857" fontWeight={600}>
                                  Evidence Number
                                </Text>
                                <Text fontSize="0.9rem" color="#065f46" style={{ fontWeight: 500 }}>
                                  {currentEvidence.evidence_number}
                                </Text>
                              </Flex>
                              
                              {currentEvidence.description && (
                                <Flex direction="column" gap="0.25rem">
                                  <Text fontSize="0.75rem" color="#047857" fontWeight={600}>
                                    Description
                                  </Text>
                                  <Text fontSize="0.9rem" color="#065f46" style={{ fontWeight: 400 }}>
                                    {currentEvidence.description}
                                  </Text>
                                </Flex>
                              )}
                              
                              <Flex direction="column" gap="0.25rem">
                                <Text fontSize="0.75rem" color="#047857" fontWeight={600}>
                                  Uploaded
                                </Text>
                                <Text fontSize="0.9rem" color="#065f46" style={{ fontWeight: 500 }}>
                                  {formatDate(currentEvidence.uploaded_at)}
                                </Text>
                              </Flex>
                            </Flex>
                          </Flex>
                          <Divider style={{ margin: 0 }} />
                        </>
                      )}

                      <Flex direction="column" gap="1.5rem">
                        {/* File Size */}
                        <Flex direction="column" gap="0.5rem">
                          <Flex gap="0.5rem" alignItems="center" style={{ marginBottom: "0.25rem" }}>
                            <HardDrive size={18} color="#6b7280" />
                            <Text fontSize="0.8rem" color="#6b7280" fontWeight={600} style={{ letterSpacing: "0.5px" }}>
                              SIZE
                            </Text>
                          </Flex>
                          <Text fontSize="0.95rem" color="#111827" style={{ fontWeight: 500 }}>
                            {formatFileSize(selectedFile.size)}
                          </Text>
                        </Flex>

                        {/* File Type */}
                        <Flex direction="column" gap="0.5rem">
                          <Flex gap="0.5rem" alignItems="center" style={{ marginBottom: "0.25rem" }}>
                            {getFileIcon(selectedFile.name)}
                            <Text fontSize="0.8rem" color="#6b7280" fontWeight={600} style={{ letterSpacing: "0.5px" }}>
                              TYPE
                            </Text>
                          </Flex>
                          <Text fontSize="0.95rem" color="#111827" style={{ fontWeight: 500 }}>
                            {selectedFile.name.split(".").pop()?.toUpperCase() || "Unknown"}
                          </Text>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Card>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      {/* Blur Overlay with "Link has Expired" message */}
      {isPreviewExpired && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(17, 24, 39, 0.75)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Card
            variation="outlined"
            style={{
              maxWidth: "520px",
              padding: "3rem 2.5rem",
              textAlign: "center",
              backgroundColor: "#ffffff",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Flex direction="column" gap="1.5rem" alignItems="center">
              <img
                src={logo}
                alt="Logo"
                style={{ height: "56px", objectFit: "contain" }}
              />
              
              <Divider style={{ width: "100%", margin: "0.5rem 0" }} />
              
              <Flex direction="column" gap="1rem" alignItems="center">
                <Heading level={2} style={{ margin: 0, color: "#111827", fontSize: "1.75rem" }}>
                  Link has Expired
                </Heading>
                
                <Text color="#6b7280" fontSize="1rem" style={{ lineHeight: "1.6", maxWidth: "420px" }}>
                  This preview link has expired for security purposes. Preview links are valid for 7 Days.
                </Text>
              </Flex>
              
              <Divider style={{ width: "100%", margin: "0.5rem 0" }} />
              
              <Flex 
                direction="column" 
                gap="0.75rem" 
                padding="1.25rem" 
                style={{ 
                  backgroundColor: "#eff6ff", 
                  borderRadius: "8px",
                  border: "1px solid #dbeafe",
                  width: "100%"
                }}
              >
                <Flex gap="0.5rem" alignItems="center" justifyContent="center">
                  <div style={{ fontSize: "1.25rem" }}></div>
                  <Text fontSize="0.875rem" color="#1e40af" fontWeight={600}>
                    NEED CONTINUED ACCESS?
                  </Text>
                </Flex>
                <Text color="#1e3a8a" fontSize="0.9rem" style={{ lineHeight: "1.5" }}>
                  Please contact the Case agent to request a new share link.
                </Text>
              </Flex>
            </Flex>
          </Card>
        </div>
      )}
    </Flex>
  );
};