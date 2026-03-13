import { useState, useMemo, useEffect, useCallback } from 'react';
import { SettingsPage } from '@/pages/SettingsPage';
import { LogOut, Calendar, List, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { haptic } from '@/hooks/useHapticFeedback';
import { PeriodSummary } from '@/components/PeriodSummary';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseSheet } from '@/components/AddExpenseSheet';
import { EditExpenseSheet } from '@/components/EditExpenseSheet';
import { PeriodNavigator, PeriodType } from '@/components/PeriodNavigator';
import { CategoryPieChart } from '@/components/CategoryPieChart';
import { SpendingTrendsChart } from '@/components/SpendingTrendsChart';
import { HistoricalTrendsChart } from '@/components/HistoricalTrendsChart';
import { CashflowOverview } from '@/components/CashflowOverview';
import { FinancialHealthIndicators } from '@/components/FinancialHealthIndicators';
import { ExpenseFilter } from '@/components/ExpenseFilter';
import { ExpenseCalendar } from '@/components/ExpenseCalendar';
import { DayExpensesSheet } from '@/components/DayExpensesSheet';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { PullToRefresh } from '@/components/PullToRefresh';
import { NotificationSettings } from '@/components/NotificationSettings';
import { ExportExpenses } from '@/components/ExportExpenses';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BottomNav } from '@/components/BottomNav';
import { EmptyState } from '@/components/EmptyState';
import { AuthPage } from '@/pages/AuthPage';
import { Expense } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import appLogo from '@/assets/app-logo.png';
import { SkeletonDashboard } from '@/components/SkeletonDashboard';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<Expense[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'history' | 'settings'>('dashboard');
  const [isExpensesOpen, setIsExpensesOpen] = useState(() => {
    const saved = localStorage.getItem('expenses-section-open');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const handleExpensesOpenChange = (open: boolean) => {
    setIsExpensesOpen(open);
    localStorage.setItem('expenses-section-open', JSON.stringify(open));
  };

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
    refreshExpenses,
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

  const { categories, addCategory } = useCategories();

  const handleDuplicateExpense = useCallback(async (expense: Expense) => {
    const today = new Date();
    await addExpense({
      amount: expense.amount,
      category: expense.category,
      date: format(today, 'yyyy-MM-dd'),
      time: format(today, 'HH:mm:ss'),
      note: expense.note,
    });
    haptic.success();
  }, [addExpense]);

  const handleDeleteExpense = useCallback(async (id: string) => {
    await deleteExpense(id);
    haptic.warning();
  }, [deleteExpense]);

  const isNewUser = isLoaded && expenses.length === 0;

  // Show loading state
  if (loading || !isLoaded) {
    return <SkeletonDashboard />;
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
    haptic.light();
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };


  const handleTabChange = (tab: 'dashboard' | 'add' | 'history') => {
    if (tab === 'history') {
      setActiveTab('history');
      if (!isExpensesOpen) {
        handleExpensesOpenChange(true);
      }
      setTimeout(() => {
        document.querySelector('[data-expenses-section]')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
    <PullToRefresh onRefresh={refreshExpenses}>
    <div className="min-h-screen bg-background pb-24">
      {/* Offline Indicator */}
      <OfflineIndicator pendingCount={pendingCount} isSyncing={isSyncing} />

      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-card shadow-sm border border-border flex items-center justify-center overflow-hidden">
              <img src={appLogo} alt="Expense Tracker" className="w-8 h-8 object-contain" />
            </div>
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
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
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
      <main className="px-5 space-y-7">
        {/* Show empty state for new users */}
        {isNewUser ? (
          <EmptyState />
        ) : (
          <>
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
              <CategoryPieChart 
                categoryTotals={categoryTotals} 
                onCategoryClick={(categoryName) => {
                  setSelectedCategories([categoryName]);
                  if (!isExpensesOpen) {
                    handleExpensesOpenChange(true);
                  }
                  setTimeout(() => {
                    document.querySelector('[data-expenses-section]')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              />
            </div>

            {/* Cashflow Overview */}
            <div className="animate-in-delay-2">
              <CashflowOverview
                expenses={expenses}
                periodType={periodType}
                currentDate={selectedDate}
              />
            </div>

            {/* Financial Health Indicators */}
            <div className="animate-in-delay-2">
              <FinancialHealthIndicators
                expenses={expenses}
                periodType={periodType}
                currentDate={selectedDate}
              />
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
            <Collapsible open={isExpensesOpen} onOpenChange={handleExpensesOpenChange} data-expenses-section>
              <div className="flex items-center justify-between mb-4">
                <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Expenses
                  </h2>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isExpensesOpen && "rotate-180"
                  )} />
                  <span className="text-sm text-muted-foreground">
                    ({periodExpenses.length} {periodExpenses.length === 1 ? 'item' : 'items'})
                  </span>
                </CollapsibleTrigger>
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

              <CollapsibleContent className="space-y-4">
                {viewMode === 'list' || periodType !== 'month' ? (
                  <>
                    {/* Search & Filter */}
                    <div>
                      <ExpenseFilter
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedCategories={selectedCategories}
                        onCategoriesChange={setSelectedCategories}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {filteredExpenses.length} of {periodExpenses.length} {periodExpenses.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <ExpenseList 
                      expenses={filteredExpenses} 
                      onEdit={setEditingExpense}
                      onDelete={handleDeleteExpense}
                      onDuplicate={handleDuplicateExpense}
                    />
                  </>
                ) : (
                  <ExpenseCalendar
                    expenses={periodExpenses}
                    selectedMonth={selectedDate}
                    onDaySelect={handleDaySelect}
                  />
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </main>

      {/* Add Expense Sheet */}
      <AddExpenseSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={addExpense}
        categories={categories}
        onAddCategory={addCategory}
        mostUsedCategory={
          expenses.length > 0
            ? Object.entries(getCategoryTotals(expenses))
                .sort(([, a], [, b]) => b - a)[0]?.[0]
            : undefined
        }
      />

      {/* Edit Expense Sheet */}
      <EditExpenseSheet
        expense={editingExpense}
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
        categories={categories}
        onAddCategory={addCategory}
      />

      {/* Day Expenses Sheet */}
      <DayExpensesSheet
        open={isDaySheetOpen}
        onOpenChange={setIsDaySheetOpen}
        date={selectedDayDate}
        expenses={selectedDayExpenses}
        onEditExpense={setEditingExpense}
      />

      {/* Footer */}
      <footer className="mt-12 pb-24 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Addo. All rights reserved.
      </footer>
    </div>
    </PullToRefresh>

    {/* Bottom Navigation - Outside PullToRefresh so fixed positioning works */}
    <BottomNav 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      onAddPress={() => {
        haptic.medium();
        setIsAddOpen(true);
      }}
    />
    </>
  );
};

export default Index;
