import { useState } from 'react';
import { Plus, LogOut, Calendar, List } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { MonthlySummary } from '@/components/MonthlySummary';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseSheet } from '@/components/AddExpenseSheet';
import { EditExpenseSheet } from '@/components/EditExpenseSheet';
import { MonthNavigator } from '@/components/MonthNavigator';
import { CategoryPieChart } from '@/components/CategoryPieChart';
import { ExpenseFilter } from '@/components/ExpenseFilter';
import { ExpenseCalendar } from '@/components/ExpenseCalendar';
import { DayExpensesSheet } from '@/components/DayExpensesSheet';
import { AuthPage } from '@/pages/AuthPage';
import { Expense, Category } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  
  const { 
    addExpense,
    updateExpense,
    deleteExpense, 
    getMonthlyTotal, 
    getCategoryTotals, 
    getMonthlyExpenses,
    isLoaded,
  } = useExpenses();

  // Show loading state
  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not signed in
  if (!user) {
    return <AuthPage />;
  }

  const monthlyTotal = getMonthlyTotal(selectedMonth);
  const categoryTotals = getCategoryTotals(selectedMonth);
  const monthlyExpenses = getMonthlyExpenses(selectedMonth);

  // Filter expenses based on search query and selected categories
  const filteredExpenses = monthlyExpenses.filter(expense => {
    const matchesSearch = !searchQuery || 
      (expense.note && expense.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(expense.category);
    return matchesSearch && matchesCategory;
  });

  const handleMonthChange = (month: Date) => {
    setSelectedMonth(month);
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedDate(null);
    setSelectedDayExpenses([]);
  };

  const handleDaySelect = (date: Date, expenses: Expense[]) => {
    setSelectedDate(date);
    setSelectedDayExpenses(expenses);
    setIsDaySheetOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Expense Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              {user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 space-y-6">
        {/* Month Navigator */}
        <MonthNavigator 
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
        />

        {/* Monthly Summary */}
        <MonthlySummary 
          total={monthlyTotal} 
          categoryTotals={categoryTotals}
          month={selectedMonth}
        />

        {/* Category Pie Chart */}
        <CategoryPieChart categoryTotals={categoryTotals} />

        {/* Expenses Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Expenses
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === 'list' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === 'calendar' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'list' ? (
            <>
              {/* Search & Filter */}
              <div className="mb-4">
                <ExpenseFilter
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCategories={selectedCategories}
                  onCategoriesChange={setSelectedCategories}
                />
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-muted-foreground">
                  {filteredExpenses.length} of {monthlyExpenses.length} {monthlyExpenses.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <ExpenseList 
                expenses={filteredExpenses} 
                onEdit={setEditingExpense}
              />
            </>
          ) : (
            <ExpenseCalendar
              expenses={monthlyExpenses}
              selectedMonth={selectedMonth}
              onDaySelect={handleDaySelect}
            />
          )}
        </section>
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="float-button"
        aria-label="Add expense"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Add Expense Sheet */}
      <AddExpenseSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={addExpense}
      />

      {/* Edit Expense Sheet */}
      <EditExpenseSheet
        expense={editingExpense}
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
      />

      {/* Day Expenses Sheet */}
      <DayExpensesSheet
        open={isDaySheetOpen}
        onOpenChange={setIsDaySheetOpen}
        date={selectedDate}
        expenses={selectedDayExpenses}
        onEditExpense={setEditingExpense}
      />
    </div>
  );
};

export default Index;
