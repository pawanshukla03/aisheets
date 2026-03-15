import type { CellData, CellFormat } from '../types/sheet';

interface CellProps {
  row: number;
  col: number;
  data: CellData | undefined;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onCommit: (value: string, moveToNext?: boolean) => void;
  onCancel: () => void;
  editValue: string;
  onEditChange: (value: string) => void;
}

function formatDisplay(value: string | number | undefined, format?: CellFormat): string {
  if (value === undefined || value === null) return '';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (Number.isNaN(num)) return String(value);
  switch (format?.numberFormat) {
    case 'currency':
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
    case 'percent':
      return new Intl.NumberFormat(undefined, { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
    case 'number':
      return new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
    default:
      return String(value);
  }
}

export function Cell({
  row,
  col,
  data,
  isSelected,
  isEditing,
  onSelect,
  onDoubleClick,
  onCommit,
  onCancel,
  editValue,
  onEditChange,
}: CellProps) {
  const display = data?.computed !== undefined && data?.computed !== null && data?.computed !== ''
    ? formatDisplay(data.computed as string | number, data.format)
    : (data?.raw ?? '');
  const format = data?.format;
  const showRaw = typeof data?.raw === 'string' && data.raw.startsWith('=');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit(editValue, true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onCommit(editValue, false);
    }
  };

  const cellStyle: React.CSSProperties = {
    textAlign: format?.textAlign ?? undefined,
    verticalAlign: format?.verticalAlign ?? undefined,
    backgroundColor: format?.backgroundColor ?? undefined,
  };
  const valueStyle: React.CSSProperties = {
    fontFamily: format?.fontFamily ?? undefined,
    fontWeight: format?.bold ? 'bold' : undefined,
    fontStyle: format?.italic ? 'italic' : undefined,
    textDecoration: [
      format?.underline ? 'underline' : undefined,
      format?.strikethrough ? 'line-through' : undefined,
    ].filter(Boolean).join(' ') || undefined,
    fontSize: format?.fontSize ? `${format.fontSize}px` : undefined,
    color: format?.textColor ?? undefined,
    whiteSpace: format?.wrap ? 'normal' : 'nowrap',
    wordBreak: format?.wrap ? 'break-word' : undefined,
  };
  const inputStyle: React.CSSProperties = {
    fontFamily: format?.fontFamily ?? undefined,
    fontWeight: format?.bold ? 'bold' : undefined,
    fontStyle: format?.italic ? 'italic' : undefined,
    fontSize: format?.fontSize ? `${format.fontSize}px` : undefined,
    color: format?.textColor ?? undefined,
  };

  return (
    <td
      className={`cell ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${format?.wrap ? 'cell-wrap' : ''}`}
      style={cellStyle}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {isEditing ? (
        <input
          type="text"
          className="cell-input"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCommit(editValue, false)}
          autoFocus
          data-row={row}
          data-col={col}
          style={inputStyle}
        />
      ) : (
        <span
          className="cell-value"
          style={valueStyle}
          title={showRaw ? String(data?.raw) : undefined}
        >
          {display}
        </span>
      )}
    </td>
  );
}
