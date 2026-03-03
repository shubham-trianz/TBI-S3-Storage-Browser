import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Flex,
  Heading,
  Text,
  SelectField,
} from '@aws-amplify/ui-react';
import { ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
  files: string[]; // full S3 keys in temp
  identityId: string;
  cases: Case[];
  tempEvidence: TempEvidenceMeta[]; // evidence metadata from temp
  onClose: () => void;
  onMoved: () => void;
}
 
export const MoveDialog = ({
  open,
  files,
  // identityId,
  cases,
  tempEvidence,
  onClose,
  onMoved,
}: MoveDialogProps) => {
  const [selectedCase, setSelectedCase] = useState('');
  const [subfolders, setSubfolders] = useState<string[]>([]);
  const [selectedSubfolder, setSelectedSubfolder] = useState('');
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [moving, setMoving] = useState(false);
  const s3Ref = useRef<any>(null);
  const bucket = amplifyConfig.storage.bucket_name;
 
  useEffect(() => {
    createS3Client().then(c => (s3Ref.current = c));
  }, []);
 
  useEffect(() => {
    if (open) {
      setSelectedCase('');
      setSubfolders([]);
      setSelectedSubfolder('');
    }
  }, [open]);
 
  useEffect(() => {
    if (!selectedCase || !s3Ref.current) return;
 
    const caseObj = cases.find(c => c.case_number === selectedCase);
    if (!caseObj) return;
 
    const caseRoot = caseObj.source_key.endsWith('/')
      ? caseObj.source_key
      : `${caseObj.source_key}/`;
 
    setLoadingFolders(true);
    setSubfolders([]);
    setSelectedSubfolder('');
 
    const fetchFolders = async () => {
      try {
        const cmd = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: caseRoot,
          Delimiter: '/',
        });
        const res = await s3Ref.current.send(cmd);
        const folders = (res.CommonPrefixes || [])
          .map((p: any) => p.Prefix as string)
          .filter((p: string) => p !== caseRoot);
        setSubfolders(folders);
      } catch (err) {
        console.error('Failed to load subfolders', err);
      } finally {
        setLoadingFolders(false);
      }
    };
 
    fetchFolders();
  }, [selectedCase, cases, bucket]);
 
  if (!open) return null;
 
  const getCaseRoot = () => {
    const caseObj = cases.find(c => c.case_number === selectedCase);
    if (!caseObj) return null;
    return caseObj.source_key.endsWith('/')
      ? caseObj.source_key
      : `${caseObj.source_key}/`;
  };
 
  const getDestinationPrefix = () => {
    const root = getCaseRoot();
    if (!root) return null;
    return selectedSubfolder ? selectedSubfolder : root;
  };
 
  const handleMove = async () => {
    const dest = getDestinationPrefix();
    if (!dest) return;
 
    setMoving(true);
    try {
      for (const key of files) {
        const filename = key.split('/').pop();
        if (!filename) continue;
 
        const destKey = `${dest}${filename}`;
 
        // 1. Copy file to destination in S3
        await s3Ref.current.send(
          new CopyObjectCommand({
            Bucket: bucket,
            CopySource: `${bucket}/${encodeURIComponent(key)}`,
            Key: destKey,
          })
        );
 
        // 2. Delete from temp in S3
        await s3Ref.current.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );
 
        // 3. Migrate evidence metadata to new case in DynamoDB
        const existingMeta = tempEvidence.find(
          ev => ev.source_key === key || ev.source_key?.split('/').pop() === filename
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
 
  const destLabel = (() => {
    if (!selectedCase) return null;
    const root = getCaseRoot();
    const folder = selectedSubfolder
      ? selectedSubfolder.replace(root ?? '', '').replace(/\/$/, '')
      : '(case root)';
    return `${selectedCase} / ${folder}`;
  })();
 
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'white', borderRadius: 8,
        padding: '1.5rem', minWidth: 440, maxWidth: 540,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <Heading level={5} marginBottom="0.25rem">Move Files</Heading>
        <Text variation="tertiary" fontSize="small" marginBottom="1rem">
          Moving {files.length} file{files.length > 1 ? 's' : ''} to a case folder
        </Text>
 
        <Flex direction="column" gap="1rem">
          <SelectField
            label="Select Case"
            placeholder="-- Pick a case --"
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
          >
            {cases.map(c => (
              <option key={c.case_number} value={c.case_number}>
                {c.case_number}{c.case_title ? ` — ${c.case_title}` : ''}
              </option>
            ))}
          </SelectField>
 
          {selectedCase && (
            <SelectField
              label="Select Subfolder (optional)"
              placeholder={loadingFolders ? 'Loading...' : '-- Case root --'}
              value={selectedSubfolder}
              onChange={(e) => setSelectedSubfolder(e.target.value)}
              isDisabled={loadingFolders}
            >
              {subfolders.map(f => {
                const root = getCaseRoot() ?? '';
                const label = f.replace(root, '').replace(/\/$/, '');
                return (
                  <option key={f} value={f}>{label}</option>
                );
              })}
            </SelectField>
          )}
 
          {destLabel && (
            <Text fontSize="small" color="var(--amplify-colors-neutral-60)">
              Destination: <strong>{destLabel}</strong>
            </Text>
          )}
        </Flex>
 
        <Flex justifyContent="flex-end" gap="0.5rem" marginTop="1.5rem">
          <Button size="small" onClick={onClose} disabled={moving}>
            Cancel
          </Button>
          <Button
            size="small"
            variation="primary"
            isLoading={moving}
            loadingText="Moving..."
            disabled={!selectedCase || moving}
            onClick={handleMove}
          >
            Move
          </Button>
        </Flex>
      </div>
    </div>
  );
};