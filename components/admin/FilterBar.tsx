'use client';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  }[];
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOptions: FilterOption[];
  onReset: () => void;
  showReset?: boolean;
}

export default function FilterBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Căutare...',
  filters = [],
  sortBy,
  onSortChange,
  sortOptions,
  onReset,
  showReset = false
}: FilterBarProps) {
  return (
    <div className="bg-white border rounded-lg p-4 mb-6 space-y-4">
      <h4 className="font-semibold text-lg mb-3">🔍 Căutare și Filtre</h4>
      
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(4, 2 + filters.length)} gap-4`}>
        {/* Căutare */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Căutare
          </label>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Filtre dinamice */}
        {filters.map((filter, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {filter.label}
            </label>
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Sortare */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sortare
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buton reset filtre */}
      {showReset && (
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
        >
          🔄 Resetează filtrele
        </button>
      )}
    </div>
  );
}
