import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Expense, getCategoryInfo } from '@/types/expense';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportExpensesProps {
  expenses: Expense[];
  periodLabel: string;
}

export const ExportExpenses = ({ expenses, periodLabel }: ExportExpensesProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = () => {
    if (expenses.length === 0) {
      toast({
        title: "No expenses to export",
        description: "Add some expenses first before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const headers = ['Date', 'Time', 'Category', 'Amount', 'Note'];
      const rows = expenses.map(expense => [
        format(new Date(expense.date), 'yyyy-MM-dd'),
        expense.time?.slice(0, 5) || '12:00',
        getCategoryInfo(expense.category).label,
        expense.amount.toFixed(2),
        expense.note || '',
      ]);

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      rows.push(['', '', 'Total', total.toFixed(2), '']);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Exported ${expenses.length} expenses to CSV.`,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export expenses to CSV.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    if (expenses.length === 0) {
      toast({
        title: "No expenses to export",
        description: "Add some expenses first before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Expense Report', 14, 22);
      
      // Period subtitle
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(periodLabel, 14, 30);
      
      // Reset text color
      doc.setTextColor(0);

      // Table data
      const tableData = expenses.map(expense => [
        format(new Date(expense.date), 'MMM d, yyyy'),
        expense.time?.slice(0, 5) || '12:00',
        getCategoryInfo(expense.category).label,
        `₵${expense.amount.toFixed(2)}`,
        expense.note || '-',
      ]);

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);

      // Generate table
      autoTable(doc, {
        startY: 38,
        head: [['Date', 'Time', 'Category', 'Amount', 'Note']],
        body: tableData,
        foot: [['', '', 'Total', `₵${total.toFixed(2)}`, '']],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 'auto' },
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')} • Page ${i} of ${pageCount}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`expenses-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`);

      toast({
        title: "Export successful",
        description: `Exported ${expenses.length} expenses to PDF.`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export expenses to PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isExporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
