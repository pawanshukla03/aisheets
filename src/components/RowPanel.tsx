import { useState, useRef } from 'react';
import type { RowComment, RowAttachment } from '../types/sheet';

interface RowPanelProps {
  rowIndex: number;
  comments: RowComment[];
  attachments: RowAttachment[];
  onAddComment: (text: string) => void;
  onDeleteComment: (id: string) => void;
  onAddAttachment: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  onClose: () => void;
}

export function RowPanel({
  rowIndex,
  comments,
  attachments,
  onAddComment,
  onDeleteComment,
  onAddAttachment,
  onRemoveAttachment,
  onClose,
}: RowPanelProps) {
  const [newComment, setNewComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newComment.trim();
    if (t) {
      onAddComment(t);
      setNewComment('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAddAttachment(file);
    e.target.value = '';
  };

  const handleDownload = (att: RowAttachment) => {
    try {
      const bin = atob(att.data);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: att.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

  const formatSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="row-panel-overlay" onClick={onClose}>
      <div className="row-panel" onClick={(e) => e.stopPropagation()}>
        <div className="row-panel-header">
          <h3>Row {rowIndex + 1} – Comments & attachments</h3>
          <button type="button" className="row-panel-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <section className="row-panel-section">
          <h4>Comments</h4>
          <ul className="row-panel-comments">
            {comments.length === 0 && (
              <li className="row-panel-empty">No comments yet.</li>
            )}
            {comments.map((c) => (
              <li key={c.id} className="row-panel-comment">
                <p className="row-panel-comment-text">{c.text}</p>
                <div className="row-panel-comment-meta">
                  <span>{formatDate(c.createdAt)}</span>
                  <button type="button" className="row-panel-btn-link" onClick={() => onDeleteComment(c.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <form onSubmit={handleSubmitComment} className="row-panel-comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="row-panel-textarea"
            />
            <button type="submit" className="row-panel-btn primary">Post</button>
          </form>
        </section>

        <section className="row-panel-section">
          <h4>Attachments</h4>
          <input
            ref={fileInputRef}
            type="file"
            className="row-panel-file-input"
            onChange={handleFileChange}
            multiple={false}
          />
          <button
            type="button"
            className="row-panel-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Attach file
          </button>
          <ul className="row-panel-attachments">
            {attachments.length === 0 && (
              <li className="row-panel-empty">No attachments.</li>
            )}
            {attachments.map((a) => (
              <li key={a.id} className="row-panel-attachment">
                <span className="row-panel-attachment-name" title={a.name}>{a.name}</span>
                <span className="row-panel-attachment-size">{formatSize(a.size)}</span>
                <button type="button" className="row-panel-btn-link" onClick={() => handleDownload(a)}>
                  Download
                </button>
                <button type="button" className="row-panel-btn-link danger" onClick={() => onRemoveAttachment(a.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
