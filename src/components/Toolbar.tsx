import type { CellFormat } from '../types/sheet';
import { FunctionsMenu } from './FunctionsMenu';

const FONT_OPTIONS = [
  { value: '', label: 'Font' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Palatino Linotype', label: 'Palatino Linotype' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Lucida Sans Unicode', label: 'Lucida Sans Unicode' },
  { value: 'Lucida Console', label: 'Lucida Console' },
  { value: 'Garamond', label: 'Garamond' },
  { value: 'Bookman Old Style', label: 'Bookman Old Style' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'system-ui', label: 'System UI' },
];

interface ToolbarProps {
  selection: { row: number; col: number } | null;
  cellFormat: CellFormat | undefined;
  onFormat: (format: Partial<CellFormat>) => void;
  onInsertRow: (beforeRow: number) => void;
  onInsertColumn: (beforeCol: number) => void;
  onDeleteRow: (row: number) => void;
  onDeleteColumn: (col: number) => void;
  onCopy: () => void;
  onPaste: () => void;
  canPaste: boolean;
  onInsertFormula: (formulaPrefix: string) => void;
}

export function Toolbar({
  selection,
  cellFormat,
  onFormat,
  onInsertRow,
  onInsertColumn,
  onDeleteRow,
  onDeleteColumn,
  onCopy,
  onPaste,
  canPaste,
  onInsertFormula,
}: ToolbarProps) {
  const hasSelection = selection !== null;

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <FunctionsMenu onInsertFormula={onInsertFormula} disabled={!hasSelection} />
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          title="Bold"
          onClick={() => onFormat({ bold: !cellFormat?.bold })}
          disabled={!hasSelection}
          data-active={cellFormat?.bold}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Italic"
          onClick={() => onFormat({ italic: !cellFormat?.italic })}
          disabled={!hasSelection}
          data-active={cellFormat?.italic}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Underline"
          onClick={() => onFormat({ underline: !cellFormat?.underline })}
          disabled={!hasSelection}
          data-active={cellFormat?.underline}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Strikethrough"
          onClick={() => onFormat({ strikethrough: !cellFormat?.strikethrough })}
          disabled={!hasSelection}
          data-active={cellFormat?.strikethrough}
        >
          <s>S</s>
        </button>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        <select
          className="toolbar-select toolbar-font-select"
          title="Font"
          value={cellFormat?.fontFamily ?? ''}
          onChange={(e) => onFormat({ fontFamily: e.target.value || undefined })}
          disabled={!hasSelection}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value || 'default'} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          className="toolbar-select toolbar-select-narrow"
          title="Font size"
          value={cellFormat?.fontSize ?? ''}
          onChange={(e) => onFormat({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
          disabled={!hasSelection}
        >
          <option value="">Size</option>
          {[10, 11, 12, 14, 16, 18, 20, 24].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="toolbar-color-wrap" title="Text color">
          <input
            type="color"
            className="toolbar-color-input"
            value={cellFormat?.textColor || '#000000'}
            onChange={(e) => onFormat({ textColor: e.target.value })}
            disabled={!hasSelection}
          />
          <span className="toolbar-color-label">A</span>
        </span>
        <span className="toolbar-color-wrap" title="Fill color">
          <input
            type="color"
            className="toolbar-color-input"
            value={cellFormat?.backgroundColor || '#ffffff'}
            onChange={(e) => onFormat({ backgroundColor: e.target.value })}
            disabled={!hasSelection}
          />
          <span className="toolbar-color-label toolbar-fill-icon">▤</span>
        </span>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        <select
          className="toolbar-select"
          title="Number format"
          value={cellFormat?.numberFormat ?? 'plain'}
          onChange={(e) => onFormat({ numberFormat: e.target.value as CellFormat['numberFormat'] })}
          disabled={!hasSelection}
        >
          <option value="plain">Plain</option>
          <option value="number">Number</option>
          <option value="currency">Currency</option>
          <option value="percent">Percent</option>
        </select>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        <select
          className="toolbar-select toolbar-select-narrow"
          title="Horizontal alignment"
          value={cellFormat?.textAlign ?? ''}
          onChange={(e) => onFormat({ textAlign: (e.target.value || undefined) as CellFormat['textAlign'] })}
          disabled={!hasSelection}
        >
          <option value="">Align</option>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
        <select
          className="toolbar-select toolbar-select-narrow"
          title="Vertical alignment"
          value={cellFormat?.verticalAlign ?? ''}
          onChange={(e) => onFormat({ verticalAlign: (e.target.value || undefined) as CellFormat['verticalAlign'] })}
          disabled={!hasSelection}
        >
          <option value="">Vertical</option>
          <option value="top">Top</option>
          <option value="middle">Middle</option>
          <option value="bottom">Bottom</option>
        </select>
        <button
          type="button"
          className="toolbar-btn"
          title="Wrap text"
          onClick={() => onFormat({ wrap: !cellFormat?.wrap })}
          disabled={!hasSelection}
          data-active={cellFormat?.wrap}
        >
          Wrap
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Clear formatting"
          onClick={() => onFormat({
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
            fontFamily: undefined,
            fontSize: undefined,
            textColor: undefined,
            backgroundColor: undefined,
            textAlign: undefined,
            verticalAlign: undefined,
            wrap: false,
            numberFormat: undefined,
          })}
          disabled={!hasSelection}
        >
          Clear format
        </button>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        <button type="button" className="toolbar-btn" title="Copy" onClick={onCopy} disabled={!hasSelection}>
          Copy
        </button>
        <button type="button" className="toolbar-btn" title="Paste" onClick={onPaste} disabled={!canPaste}>
          Paste
        </button>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          title="Insert row above"
          onClick={() => hasSelection && onInsertRow(selection.row)}
          disabled={!hasSelection}
        >
          Insert row
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Insert column left"
          onClick={() => hasSelection && onInsertColumn(selection.col)}
          disabled={!hasSelection}
        >
          Insert col
        </button>
        <button
          type="button"
          className="toolbar-btn danger"
          title="Delete row"
          onClick={() => hasSelection && onDeleteRow(selection.row)}
          disabled={!hasSelection}
        >
          Delete row
        </button>
        <button
          type="button"
          className="toolbar-btn danger"
          title="Delete column"
          onClick={() => hasSelection && onDeleteColumn(selection.col)}
          disabled={!hasSelection}
        >
          Delete col
        </button>
      </div>
    </div>
  );
}
