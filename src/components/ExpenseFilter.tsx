import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';

interface ExpenseFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export const ExpenseFilter = ({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
}: ExpenseFilterProps) => {
  const { categories } = useCategories();
  const [showFilters, setShowFilters] = useState(false);

  const toggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onCategoriesChange(selectedCategories.filter(c => c !== categoryName));
    } else {
      onCategoriesChange([...selectedCategories, categoryName]);
    }
  };

  const clearFilters = () => {
    onSearchChange('');
    onCategoriesChange([]);
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by note or category..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 bg-card"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "h-11 w-11 rounded-lg flex items-center justify-center transition-colors relative",
            showFilters || selectedCategories.length > 0
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter className="h-4 w-4" />
          {selectedCategories.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
              {selectedCategories.length}
            </span>
          )}
        </button>
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.name)}
              className={cn(
                "category-badge px-3 py-1.5 text-sm transition-all duration-200",
                selectedCategories.includes(cat.name) && "ring-2 ring-offset-2 ring-primary"
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Filtering results
            {selectedCategories.length > 0 && ` by ${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'}`}
          </span>
          <button
            onClick={clearFilters}
            className="text-primary hover:underline font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
