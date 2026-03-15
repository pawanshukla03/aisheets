import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { GridData, CellData, CellFormat, RowComment, RowAttachment, SheetData } from '../types/sheet';
import { cellKey, colToLetter } from '../types/sheet';
import { isFormula, evaluateFormula } from '../utils/formula';
import { Cell } from './Cell';
import { Toolbar } from './Toolbar';
import { RowPanel } from './RowPanel';

const DEFAULT_ROWS = 50;
const DEFAULT_COLS = 26;

function getEmptyCell(): CellData {
  return { raw: '' };
}

function recomputeGrid(grid: GridData): GridData {
  const next: GridData = { ...grid };
  const keys = Object.keys(next);
  // Multiple passes for dependency order (simple approach: 3 passes)
  for (let pass = 0; pass < 3; pass++) {
    for (const key of keys) {
      const cell = next[key];
      if (!cell?.raw || !isFormula(cell.raw)) continue;
      const [r, c] = key.split(',').map(Number);
      const computed = evaluateFormula(cell.raw, next, r, c);
      next[key] = { ...cell, computed: computed ?? '' };
    }
  }
  return next;
}

export interface SpreadsheetRef {
  getData: () => SheetData;
  loadData: (data: SheetData) => void;
}

interface SpreadsheetProps {
  initialData?: SheetData | null;
}

export const Spreadsheet = forwardRef<SpreadsheetRef, SpreadsheetProps>(function Spreadsheet({ initialData }, ref) {
  const [rows] = useState(DEFAULT_ROWS);
  const [cols] = useState(DEFAULT_COLS);
  const [grid, setGrid] = useState<GridData>(() => ({}));
  const [selection, setSelection] = useState<{ row: number; col: number } | null>(null);
  const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [clipboard, setClipboard] = useState<{ raw: string; format?: CellFormat } | null>(null);
  const [rowComments, setRowComments] = useState<Record<number, RowComment[]>>({});
  const [rowAttachments, setRowAttachments] = useState<Record<number, RowAttachment[]>>({});
  const [rowPanelRow, setRowPanelRow] = useState<number | null>(null);
  const gridRef = useRef<HTMLTableElement>(null);

  useImperativeHandle(ref, () => ({
    getData: () => ({ grid, rowComments, rowAttachments }),
    loadData: (data: SheetData) => {
      setGrid(recomputeGrid(data.grid || {}));
      setRowComments(data.rowComments || {});
      setRowAttachments(data.rowAttachments || {});
      setSelection(null);
      setEditing(null);
    },
  }), [grid, rowComments, rowAttachments]);

  useEffect(() => {
    if (initialData) {
      setGrid(recomputeGrid(initialData.grid || {}));
      setRowComments(initialData.rowComments || {});
      setRowAttachments(initialData.rowAttachments || {});
      setSelection(null);
      setEditing(null);
    }
  }, [initialData]);

  const shiftRowMeta = useCallback((fromRow: number, delta: number, removeRow?: number) => {
    setRowComments((prev) => {
      const next: Record<number, RowComment[]> = {};
      for (const row of Object.keys(prev).map(Number)) {
        if (removeRow !== undefined && row === removeRow) continue;
        if (row > fromRow) next[row + delta] = prev[row];
        else next[row] = prev[row];
      }
      return next;
    });
    setRowAttachments((prev) => {
      const next: Record<number, RowAttachment[]> = {};
      for (const row of Object.keys(prev).map(Number)) {
        if (removeRow !== undefined && row === removeRow) continue;
        if (row > fromRow) next[row + delta] = prev[row];
        else next[row] = prev[row];
      }
      return next;
    });
    if (rowPanelRow !== null) {
      if (removeRow === rowPanelRow) setRowPanelRow(null);
      else if (delta > 0 && rowPanelRow >= fromRow) setRowPanelRow(rowPanelRow + delta);
      else if (delta < 0 && rowPanelRow > fromRow) setRowPanelRow(rowPanelRow + delta);
    }
  }, [rowPanelRow]);

  const getCell = useCallback((row: number, col: number): CellData | undefined => {
    return grid[cellKey(row, col)];
  }, [grid]);

  const setCell = useCallback((row: number, col: number, data: CellData) => {
    setGrid((prev) => {
      const next = { ...prev, [cellKey(row, col)]: data };
      return recomputeGrid(next);
    });
  }, []);

  const getCellFormat = useCallback((row: number, col: number): CellFormat | undefined => {
    return getCell(row, col)?.format;
  }, [getCell]);

  const applyFormat = useCallback((format: Partial<CellFormat>) => {
    if (selection === null) return;
    const key = cellKey(selection.row, selection.col);
    setGrid((prev) => {
      const cell = prev[key] ?? getEmptyCell();
      const newFormat = { ...cell.format, ...format };
      const next = { ...prev, [key]: { ...cell, format: newFormat } };
      return recomputeGrid(next);
    });
  }, [selection]);

  const insertRow = useCallback((beforeRow: number) => {
    setGrid((prev) => {
      const next: GridData = {};
      for (const k of Object.keys(prev)) {
        const [r, c] = k.split(',').map(Number);
        if (r >= beforeRow) next[cellKey(r + 1, c)] = prev[k];
        else next[k] = prev[k];
      }
      return recomputeGrid(next);
    });
    shiftRowMeta(beforeRow, 1);
    setSelection((s) => s && s.row >= beforeRow ? { row: s.row + 1, col: s.col } : s);
    setEditing(null);
  }, [shiftRowMeta]);

  const insertColumn = useCallback((beforeCol: number) => {
    setGrid((prev) => {
      const next: GridData = {};
      for (const k of Object.keys(prev)) {
        const [r, c] = k.split(',').map(Number);
        if (c >= beforeCol) next[cellKey(r, c + 1)] = prev[k];
        else next[k] = prev[k];
      }
      return recomputeGrid(next);
    });
    setSelection((s) => s && s.col >= beforeCol ? { row: s.row, col: s.col + 1 } : s);
    setEditing(null);
  }, []);

  const deleteRow = useCallback((row: number) => {
    setGrid((prev) => {
      const next: GridData = {};
      for (const k of Object.keys(prev)) {
        const [r, c] = k.split(',').map(Number);
        if (r === row) continue;
        if (r > row) next[cellKey(r - 1, c)] = prev[k];
        else next[k] = prev[k];
      }
      return recomputeGrid(next);
    });
    shiftRowMeta(row, -1, row);
    setSelection((s) => {
      if (!s) return null;
      if (s.row === row) return { row: Math.max(0, row - 1), col: s.col };
      if (s.row > row) return { row: s.row - 1, col: s.col };
      return s;
    });
    setEditing(null);
  }, [shiftRowMeta]);

  const deleteColumn = useCallback((col: number) => {
    setGrid((prev) => {
      const next: GridData = {};
      for (const k of Object.keys(prev)) {
        const [r, c] = k.split(',').map(Number);
        if (c === col) continue;
        if (c > col) next[cellKey(r, c - 1)] = prev[k];
        else next[k] = prev[k];
      }
      return recomputeGrid(next);
    });
    setSelection((s) => {
      if (!s) return null;
      if (s.col === col) return { row: s.row, col: Math.max(0, col - 1) };
      if (s.col > col) return { row: s.row, col: s.col - 1 };
      return s;
    });
    setEditing(null);
  }, []);

  const startEdit = useCallback((row: number, col: number, initialValue?: string) => {
    const cell = getCell(row, col);
    setEditing({ row, col });
    setEditValue(initialValue !== undefined ? initialValue : (cell?.raw ?? ''));
  }, [getCell]);

  const commitEdit = useCallback((row: number, col: number, value: string, moveToNext?: boolean) => {
    setEditing(null);
    const trimmed = value.trim();
    const key = cellKey(row, col);
    const existing = grid[key];
    const format = existing?.format;
    setGrid((prev) => {
      const next = { ...prev, [key]: { raw: trimmed, format, computed: trimmed ? undefined : '' } };
      return recomputeGrid(next);
    });
    if (moveToNext) {
      setSelection({ row: Math.min(rows - 1, row + 1), col });
    }
  }, [grid, rows]);

  const cancelEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const handleCopy = useCallback(() => {
    if (selection === null) return;
    const cell = getCell(selection.row, selection.col);
    if (cell) setClipboard({ raw: cell.raw, format: cell.format });
  }, [selection, getCell]);

  const handlePaste = useCallback(() => {
    if (clipboard === null || selection === null) return;
    setCell(selection.row, selection.col, { raw: clipboard.raw, format: clipboard.format });
  }, [clipboard, selection, setCell]);

  const addRowComment = useCallback((row: number, text: string) => {
    setRowComments((prev) => {
      const list = prev[row] ?? [];
      const comment: RowComment = { id: crypto.randomUUID(), text, createdAt: Date.now() };
      return { ...prev, [row]: [...list, comment] };
    });
  }, []);

  const deleteRowComment = useCallback((row: number, id: string) => {
    setRowComments((prev) => {
      const list = (prev[row] ?? []).filter((c) => c.id !== id);
      return list.length ? { ...prev, [row]: list } : (() => { const { [row]: _, ...rest } = prev; return rest; })();
    });
  }, []);

  const addRowAttachment = useCallback((row: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === 'string' ? reader.result.replace(/^data:[^;]+;base64,/, '') : '';
      setRowAttachments((prev) => {
        const list = prev[row] ?? [];
        const att: RowAttachment = { id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, data };
        return { ...prev, [row]: [...list, att] };
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const removeRowAttachment = useCallback((row: number, id: string) => {
    setRowAttachments((prev) => {
      const list = (prev[row] ?? []).filter((a) => a.id !== id);
      return list.length ? { ...prev, [row]: list } : (() => { const { [row]: _, ...rest } = prev; return rest; })();
    });
  }, []);

  useEffect(() => {
    const table = gridRef.current;
    if (!table) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (editing) return;
      if (e.key === 'Enter') {
        if (selection) startEdit(selection.row, selection.col);
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection) {
          setCell(selection.row, selection.col, getEmptyCell());
          e.preventDefault();
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') { handleCopy(); e.preventDefault(); }
        if (e.key === 'v') { handlePaste(); e.preventDefault(); }
      } else if (selection && !e.ctrlKey && !e.metaKey && !e.altKey) {
        let r = selection.row;
        let c = selection.col;
        if (e.key === 'ArrowDown') { r = Math.min(rows - 1, r + 1); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { r = Math.max(0, r - 1); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { c = Math.min(cols - 1, c + 1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { c = Math.max(0, c - 1); e.preventDefault(); }
        if (r !== selection.row || c !== selection.col) setSelection({ row: r, col: c });
      }
    };
    table.tabIndex = 0;
    table.addEventListener('keydown', onKeyDown);
    return () => table.removeEventListener('keydown', onKeyDown);
  }, [editing, selection, rows, cols, startEdit, setCell, handleCopy, handlePaste]);

  return (
    <div className="spreadsheet">
      <Toolbar
        selection={selection}
        cellFormat={selection ? getCellFormat(selection.row, selection.col) : undefined}
        onFormat={applyFormat}
        onInsertRow={insertRow}
        onInsertColumn={insertColumn}
        onDeleteRow={deleteRow}
        onDeleteColumn={deleteColumn}
        onCopy={handleCopy}
        onPaste={handlePaste}
        canPaste={clipboard !== null}
        onInsertFormula={(prefix) => {
          if (selection) startEdit(selection.row, selection.col, prefix);
        }}
      />
      <div className="sheet-container">
        <table ref={gridRef} className="sheet-grid" tabIndex={0}>
          <thead>
            <tr>
              <th className="corner" />
              {Array.from({ length: cols }, (_, i) => (
                <th key={i} className="col-header">
                  {colToLetter(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => {
              const commentCount = (rowComments[row] ?? []).length;
              const attachmentCount = (rowAttachments[row] ?? []).length;
              const hasMeta = commentCount > 0 || attachmentCount > 0;
              return (
              <tr key={row}>
                <th className="row-header">
                  <span className="row-header-number">{row + 1}</span>
                  <button
                    type="button"
                    className="row-header-meta-btn"
                    onClick={(e) => { e.stopPropagation(); setRowPanelRow(row); }}
                    title="Comments & attachments"
                    aria-label="Open comments and attachments for row"
                  >
                    {hasMeta ? (
                      <span className="row-header-meta-badges">
                        {commentCount > 0 && <span className="row-header-badge" data-kind="comment">{commentCount}</span>}
                        {attachmentCount > 0 && <span className="row-header-badge" data-kind="attach">{attachmentCount}</span>}
                      </span>
                    ) : (
                      <span className="row-header-meta-icon">⊕</span>
                    )}
                  </button>
                </th>
                {Array.from({ length: cols }, (_, col) => (
                  <Cell
                    key={col}
                    row={row}
                    col={col}
                    data={getCell(row, col)}
                    isSelected={selection?.row === row && selection?.col === col}
                    isEditing={editing?.row === row && editing?.col === col}
                    onSelect={() => {
                    if (editing && (editing.row !== row || editing.col !== col)) {
                      commitEdit(editing.row, editing.col, editValue, false);
                    }
                    setSelection({ row, col });
                  }}
                    onDoubleClick={() => startEdit(row, col)}
                    onCommit={(value, moveToNext) => commitEdit(row, col, value, moveToNext)}
                    onCancel={cancelEdit}
                    editValue={editing?.row === row && editing?.col === col ? editValue : ''}
                    onEditChange={setEditValue}
                  />
                ))}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="formula-bar">
        {selection && (
          <span className="formula-bar-ref">
            {colToLetter(selection.col)}{selection.row + 1}
          </span>
        )}
        <input
          className="formula-input"
          readOnly={!selection}
          value={(selection && (editing ? editValue : getCell(selection.row, selection.col)?.raw)) ?? ''}
          onChange={(e) => selection && setEditValue(e.target.value)}
          onFocus={() => selection && startEdit(selection.row, selection.col)}
          onBlur={() => { if (editing && selection) commitEdit(editing.row, editing.col, editValue, false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && selection) { commitEdit(selection.row, selection.col, editValue, true); e.preventDefault(); }
            if (e.key === 'Escape') cancelEdit();
          }}
          placeholder={selection ? 'Enter value or formula (e.g. =SUM(A1:A5))' : 'Select a cell'}
        />
      </div>

      {rowPanelRow !== null && (
        <RowPanel
          rowIndex={rowPanelRow}
          comments={rowComments[rowPanelRow] ?? []}
          attachments={rowAttachments[rowPanelRow] ?? []}
          onAddComment={(text) => addRowComment(rowPanelRow, text)}
          onDeleteComment={(id) => deleteRowComment(rowPanelRow, id)}
          onAddAttachment={(file) => addRowAttachment(rowPanelRow, file)}
          onRemoveAttachment={(id) => removeRowAttachment(rowPanelRow, id)}
          onClose={() => setRowPanelRow(null)}
        />
      )}
    </div>
  );
});
