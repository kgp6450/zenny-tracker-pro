import { useState, useMemo } from 'react';
import { Plus, LogOut, Calendar, List, Eye, EyeOff } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { PeriodSummary } from '@/components/PeriodSummary';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseSheet } from '@/components/AddExpenseSheet';
import { EditExpenseSheet } from '@/components/EditExpenseSheet';
import { PeriodNavigator, PeriodType } from '@/components/PeriodNavigator';
import { CategoryPieChart } from '@/components/CategoryPieChart';
import { SpendingTrendsChart } from '@/components/SpendingTrendsChart';
import { HistoricalTrendsChart } from '@/components/HistoricalTrendsChart';
import { ExpenseFilter } from '@/components/ExpenseFilter';
import { ExpenseCalendar } from '@/components/ExpenseCalendar';
import { DayExpensesSheet } from '@/components/DayExpensesSheet';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { NotificationSettings } from '@/components/NotificationSettings';
import { ExportExpenses } from '@/components/ExportExpenses';
import { AuthPage } from '@/pages/AuthPage';
import { Expense, Category } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 1));
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<Expense[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return '••••••••';
    const maskedLocal = local.slice(0, 2) + '••••';
    return `${maskedLocal}@${domain}`;
  };
  
  const { 
    expenses,
    addExpense,
    updateExpense,
    deleteExpense, 
    getMonthlyTotal, 
    getMonthlyExpenses,
    getWeeklyExpenses,
    getWeeklyTotal,
    getYearlyExpenses,
    getYearlyTotal,
    getCategoryTotals,
    isLoaded,
    pendingCount,
    isSyncing,
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

  // Get expenses and totals based on period type
  const getPeriodExpenses = () => {
    switch (periodType) {
      case 'week':
        return getWeeklyExpenses(selectedDate);
      case 'month':
        return getMonthlyExpenses(selectedDate);
      case 'year':
        return getYearlyExpenses(selectedDate);
    }
  };

  const getPeriodTotal = () => {
    switch (periodType) {
      case 'week':
        return getWeeklyTotal(selectedDate);
      case 'month':
        return getMonthlyTotal(selectedDate);
      case 'year':
        return getYearlyTotal(selectedDate);
    }
  };

  const periodExpenses = getPeriodExpenses();
  const periodTotal = getPeriodTotal();
  const categoryTotals = getCategoryTotals(periodExpenses);

  // Filter expenses based on search query and selected categories
  const filteredExpenses = periodExpenses.filter(expense => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (expense.note && expense.note.toLowerCase().includes(searchLower)) ||
      expense.category.toLowerCase().includes(searchLower);
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(expense.category);
    return matchesSearch && matchesCategory;
  });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedDayDate(null);
    setSelectedDayExpenses([]);
  };

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type);
    setSearchQuery('');
    setSelectedCategories([]);
  };

  const handleDaySelect = (date: Date, expenses: Expense[]) => {
    setSelectedDayDate(date);
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
      {/* Offline Indicator */}
      <OfflineIndicator pendingCount={pendingCount} isSyncing={isSyncing} />

      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Expense Tracker
            </h1>
            <button 
              onClick={() => setShowEmail(!showEmail)}
              className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1 hover:text-foreground transition-colors"
            >
              {showEmail ? (
                <>
                  <span>{user.email}</span>
                  <EyeOff className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>{maskEmail(user.email || '')}</span>
                  <Eye className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <NotificationSettings />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 space-y-6">
        {/* Period Navigator */}
        <div className="animate-in">
          <PeriodNavigator 
            selectedDate={selectedDate}
            periodType={periodType}
            onDateChange={handleDateChange}
            onPeriodTypeChange={handlePeriodTypeChange}
          />
        </div>

        {/* Period Summary */}
        <div className="animate-in-delay-1">
          <PeriodSummary 
            total={periodTotal} 
            categoryTotals={categoryTotals}
            date={selectedDate}
            periodType={periodType}
          />
        </div>

        {/* Category Pie Chart */}
        <div className="animate-in-delay-2">
          <CategoryPieChart categoryTotals={categoryTotals} />
        </div>

        {/* Spending Trends Chart */}
        <div className="animate-in-delay-3">
          <SpendingTrendsChart
            expenses={expenses}
            periodType={periodType}
            currentDate={selectedDate}
          />
        </div>

        {/* Historical Trends Chart */}
        <div className="animate-in-delay-3">
          <HistoricalTrendsChart expenses={expenses} />
        </div>

        {/* Expenses Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Expenses
            </h2>
            <div className="flex items-center gap-2">
              <ExportExpenses 
                expenses={filteredExpenses} 
                periodLabel={
                  periodType === 'week' 
                    ? `Week of ${format(selectedDate, 'MMM d, yyyy')}`
                    : periodType === 'month'
                    ? format(selectedDate, 'MMMM yyyy')
                    : format(selectedDate, 'yyyy')
                }
              />
              {periodType === 'month' && (
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
              )}
            </div>
          </div>

          {viewMode === 'list' || periodType !== 'month' ? (
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
                  {filteredExpenses.length} of {periodExpenses.length} {periodExpenses.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <ExpenseList 
                expenses={filteredExpenses} 
                onEdit={setEditingExpense}
              />
            </>
          ) : (
            <ExpenseCalendar
              expenses={periodExpenses}
              selectedMonth={selectedDate}
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
        date={selectedDayDate}
        expenses={selectedDayExpenses}
        onEditExpense={setEditingExpense}
      />
    </div>
  );
};

export default Index;
