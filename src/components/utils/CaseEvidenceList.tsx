import { useState } from 'react';
import { useCaseEvidence } from '../../hooks/useCaseEvidence';

interface Props {
  caseNumber: string;
  onSelectEvidence?: (selected: string[]) => void;
}

export function CaseEvidenceList({ caseNumber, onSelectEvidence }: Props) {
  const { data, isLoading, isError } = useCaseEvidence(caseNumber);

  const [sortKey, setSortKey] = useState<
    'evidence_number' | 'uploaded_at'
  >('evidence_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (s3Key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(s3Key)) {
        next.delete(s3Key);
      } else {
        next.add(s3Key);
      }
      onSelectEvidence?.(Array.from(next));
      return next;
    });
  };

  if (isLoading) return <div>Loading evidence…</div>;
  if (isError) return <div>Failed to load evidence</div>;
  if (!data?.items?.length) return <div>No evidence uploaded</div>;

  const sortedItems = [...data.items].sort((a, b) => {
    let result = 0;

    if (sortKey === 'evidence_number') {
      result = a.evidence_number.localeCompare(
        b.evidence_number,
        undefined,
        { numeric: true }
      );
    } else {
      result =
        new Date(a.uploaded_at).getTime() -
        new Date(b.uploaded_at).getTime();
    }

    return sortOrder === 'asc' ? result : -result;
  });

  return (
    <table className="storage-table">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selected.size === sortedItems.length && sortedItems.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  const allKeys = new Set(sortedItems.map(ev => ev.s3_key));
                  setSelected(allKeys);
                  onSelectEvidence?.(Array.from(allKeys));
                } else {
                  setSelected(new Set());
                  onSelectEvidence?.([]);
                }
              }}
            />
          </th>
          <th
            style={{ cursor: 'pointer' }}
            onClick={() =>
              sortKey === 'evidence_number'
                ? setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))
                : (setSortKey('evidence_number'), setSortOrder('asc'))
            }
          >
            Evidence #
            {sortKey === 'evidence_number' &&
              (sortOrder === 'asc' ? ' ▲' : ' ▼')}
          </th>

          <th>Description</th>

          <th
            style={{ cursor: 'pointer' }}
            onClick={() =>
              sortKey === 'uploaded_at'
                ? setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))
                : (setSortKey('uploaded_at'), setSortOrder('asc'))
            }
          >
            Uploaded
            {sortKey === 'uploaded_at' &&
              (sortOrder === 'asc' ? ' ▲' : ' ▼')}
          </th>
        </tr>
      </thead>

      <tbody>
        {sortedItems.map(ev => (
          <tr key={ev.evidence_number}>
            <td>
              <input
                type="checkbox"
                checked={selected.has(ev.s3_key)}
                onChange={() => toggleSelect(ev.s3_key)}
              />
            </td>
            <td>{ev.evidence_number}</td>
            <td>{ev.description}</td>
            <td>{new Date(ev.uploaded_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}