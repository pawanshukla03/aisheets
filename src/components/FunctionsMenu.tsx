import { useState, useRef, useEffect } from 'react';
import { FUNCTIONS_BY_CATEGORY } from '../data/functionsList';

interface FunctionsMenuProps {
  onInsertFormula: (formulaPrefix: string) => void;
  disabled?: boolean;
}

export function FunctionsMenu({ onInsertFormula, disabled }: FunctionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  const categories = Object.keys(FUNCTIONS_BY_CATEGORY);

  const handleSelect = (name: string) => {
    onInsertFormula(`=${name}(`);
    setOpen(false);
    setExpandedCategory(null);
  };

  return (
    <div className="functions-menu-wrap" ref={menuRef}>
      <button
        type="button"
        className="toolbar-btn functions-menu-trigger"
        title="Insert function (Google Sheets style)"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        Functions ▾
      </button>
      {open && (
        <div className="functions-menu-dropdown">
          <div className="functions-menu-header">
            Insert function
            <a
              href="https://support.google.com/docs/table/25273?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="functions-menu-link"
            >
              Full list
            </a>
          </div>
          <div className="functions-menu-categories">
            {categories.map((cat) => (
              <div key={cat} className="functions-menu-category">
                <button
                  type="button"
                  className="functions-menu-cat-btn"
                  onClick={() => setExpandedCategory((c) => (c === cat ? null : cat))}
                >
                  {cat} {expandedCategory === cat ? '▲' : '▼'}
                </button>
                {expandedCategory === cat && (
                  <ul className="functions-menu-list">
                    {FUNCTIONS_BY_CATEGORY[cat].map((fn) => (
                      <li key={fn.name}>
                        <button
                          type="button"
                          className="functions-menu-fn-btn"
                          onClick={() => handleSelect(fn.name)}
                          title={fn.syntax}
                        >
                          <span className="functions-menu-fn-name">{fn.name}</span>
                          <span className="functions-menu-fn-desc">{fn.description}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
