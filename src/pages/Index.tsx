import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { MonthlySummary } from '@/components/MonthlySummary';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseSheet } from '@/components/AddExpenseSheet';
import { EditExpenseSheet } from '@/components/EditExpenseSheet';
import { MonthNavigator } from '@/components/MonthNavigator';
import { CategoryPieChart } from '@/components/CategoryPieChart';
import { Expense } from '@/types/expense';

const Index = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const { 
    addExpense,
    updateExpense,
    deleteExpense, 
    getMonthlyTotal, 
    getCategoryTotals, 
    getMonthlyExpenses 
  } = useExpenses();

  const monthlyTotal = getMonthlyTotal(selectedMonth);
  const categoryTotals = getCategoryTotals(selectedMonth);
  const monthlyExpenses = getMonthlyExpenses(selectedMonth);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Expense Tracker
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your spending, one expense at a time
        </p>
      </header>

      {/* Main Content */}
      <main className="px-5 space-y-6">
        {/* Month Navigator */}
        <MonthNavigator 
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        {/* Monthly Summary */}
        <MonthlySummary 
          total={monthlyTotal} 
          categoryTotals={categoryTotals}
          month={selectedMonth}
        />

        {/* Category Pie Chart */}
        <CategoryPieChart categoryTotals={categoryTotals} />

        {/* Monthly Expenses */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Expenses
            </h2>
            <span className="text-sm text-muted-foreground">
              {monthlyExpenses.length} {monthlyExpenses.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <ExpenseList 
            expenses={monthlyExpenses} 
            onEdit={setEditingExpense}
          />
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
    </div>
  );
};

export default Index;
