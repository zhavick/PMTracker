import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

/**
 * Reusable table header component with column sorting capability
 */
export default function SortableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortDesc,
  onSort,
  align = 'left',
  className = '',
  style = {},
  children
}) {
  const isActive = currentSortBy === sortKey;

  const handleClick = (e) => {
    e?.stopPropagation?.();
    if (onSort && sortKey) {
      onSort(sortKey);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  const getAlignmentClass = () => {
    if (align === 'right') return 'justify-end text-right';
    if (align === 'center') return 'justify-center text-center';
    return 'justify-start text-left';
  };

  return (
    <th
      className={`py-3.5 px-3 select-none transition-colors group ${
        sortKey ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : ''
      } ${className}`}
      style={style}
      onClick={sortKey ? handleClick : undefined}
      onKeyDown={sortKey ? handleKeyDown : undefined}
      tabIndex={sortKey ? 0 : undefined}
      role={sortKey ? 'button' : undefined}
      title={sortKey ? `Klik untuk mengurutkan berdasarkan ${label || 'kolom ini'}` : undefined}
    >
      <div className={`inline-flex items-center gap-1.5 w-full ${getAlignmentClass()}`}>
        <span
          className={`font-bold transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''
          }`}
        >
          {children || label}
        </span>

        {sortKey && (
          <span
            className={`transition-all duration-200 shrink-0 ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 opacity-100 scale-110'
                : 'text-gray-400 dark:text-gray-500 opacity-40 group-hover:opacity-100 group-hover:text-indigo-500'
            }`}
          >
            {isActive ? (
              currentSortDesc ? (
                <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 stroke-[1.75]" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}
