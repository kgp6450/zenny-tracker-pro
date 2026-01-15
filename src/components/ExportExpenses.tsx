import { useState, useRef } from 'react';
import { Download, FileText, FileSpreadsheet, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Expense, Category, getCategoryInfo } from '@/types/expense';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface ExportExpensesProps {
  expenses: Expense[];
  periodLabel: string;
}

export const ExportExpenses = ({ expenses, periodLabel }: ExportExpensesProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
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
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Expense Report', 14, 22);
      
      // Period subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(periodLabel, 14, 32);
      
      // Reset text color
      doc.setTextColor(0);

      // Table data - use GHS instead of ₵ symbol for better PDF compatibility
      const tableData = expenses.map(expense => [
        format(new Date(expense.date), 'MMM d, yyyy'),
        expense.time?.slice(0, 5) || '12:00',
        getCategoryInfo(expense.category).label,
        `GHS ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        expense.note || '-',
      ]);

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);

      // Generate table
      autoTable(doc, {
        startY: 42,
        head: [['Date', 'Time', 'Category', 'Amount', 'Note']],
        body: tableData,
        foot: [['', '', 'Total', `GHS ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']],
        theme: 'grid',
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
        },
        footStyles: { 
          fillColor: [243, 244, 246], 
          textColor: [0, 0, 0], 
          fontStyle: 'bold',
        },
        styles: { 
          fontSize: 10,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 22 },
          2: { cellWidth: 32 },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 'auto' },
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
      });

      // Summary section
      const finalY = (doc as any).lastAutoTable.finalY || 50;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Total Expenses: ${expenses.length} items`, 14, finalY + 15);

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated on ${format(new Date(), 'MMM d, yyyy')} at ${format(new Date(), 'HH:mm')} | Page ${i} of ${pageCount}`,
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

  const exportToImage = () => {
    if (expenses.length === 0) {
      toast({
        title: "No expenses to export",
        description: "Add some expenses first before exporting.",
        variant: "destructive",
      });
      return;
    }
    setShowImagePreview(true);
  };

  const downloadImage = async () => {
    if (!imageRef.current) return;
    
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(imageRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `expenses-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setShowImagePreview(false);
      toast({
        title: "Export successful",
        description: `Exported ${expenses.length} expenses as image.`,
      });
    } catch (error) {
      console.error('Image export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export expenses as image.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group expenses by category for summary
  const categoryTotals = expenses.reduce((acc, expense) => {
    const cat = expense.category;
    acc[cat] = (acc[cat] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
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
          <DropdownMenuItem onClick={exportToImage} className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Export as Image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export as Image</DialogTitle>
          </DialogHeader>
          
          <div 
            ref={imageRef} 
            className="bg-white p-6 rounded-lg"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Expense Report</h2>
              <p className="text-sm text-gray-500">{periodLabel}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-600">Total Spending</p>
              <p className="text-2xl font-bold text-blue-600">
                GHS {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">{expenses.length} expenses</p>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700">By Category</p>
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([cat, amount]) => {
                  const info = getCategoryInfo(cat as Category);
                  return (
                    <div key={cat} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span className="text-gray-700">{info.label}</span>
                      </span>
                      <span className="font-medium text-gray-900">
                        GHS {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Generated on {format(new Date(), 'MMM d, yyyy')}
            </p>
          </div>

          <Button onClick={downloadImage} disabled={isExporting} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Generating...' : 'Download Image'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
