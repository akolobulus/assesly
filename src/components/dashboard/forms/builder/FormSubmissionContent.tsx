

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Upload,
  MoreHorizontal,
  Star,
  Trash2,
  Loader2,
  Inbox,
  CheckCircle,
  ShieldAlert,
  Download,
  Mail,
  User as UserIcon,
  CheckSquare as CheckSquareIcon,
  ChevronDown as ChevronDownIcon,
  BarChart3 as ScaleIcon,
  PenTool,
  FileText,
  FileSpreadsheet,
  FileImage,
  Link as LinkIcon,
  Check,
  ArrowDown,
  ArrowUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormFieldInstance } from './types';
import { getSubmissionsForForm, deleteSubmission, updateSubmission, type Submission } from '@/lib/services/submissionService';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { SubmissionDetailSidebar } from './SubmissionDetailSidebar';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from 'firebase/firestore';

interface FormSubmissionContentProps {
  formId: string | null;
  formFields: FormFieldInstance[];
  formName: string;
}

export function FormSubmissionContent({ formId, formFields, formName }: FormSubmissionContentProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [filter, setFilter] = useState<'valid' | 'starred' | 'spam'>('valid');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('newest');

  const fetchSubmissions = useCallback(async () => {
    if (!formId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedSubmissions = await getSubmissionsForForm(formId);
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Could not fetch submissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formId, toast]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);
  
  const handleUpdateSubmissionData = async (submissionId: string, data: Partial<Submission>): Promise<boolean> => {
    if (!formId) return false;
    const result = await updateSubmission(formId, submissionId, data);
    if (result.success) {
      toast({ title: "Submission Updated" });
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, ...data } : s));
      setViewingSubmission(prev => prev ? { ...prev, ...data } : null);
      return true;
    } else {
      toast({ title: "Error updating submission", description: result.error, variant: "destructive" });
      return false;
    }
  };

  const handleScoreChange = (submissionId: string, score: number | null) => {
    const sanitizedScore = score === null ? null : Math.max(0, Math.min(100, score));
    handleUpdateSubmissionData(submissionId, { score: sanitizedScore as number });
    setEditingScoreId(null);
  }

  const filteredSubmissions = useMemo(() => {
    let sortedSubmissions = [...submissions];

    if (sortOption === 'newest') {
        sortedSubmissions.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    } else if (sortOption === 'oldest') {
        sortedSubmissions.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
    } else if (sortOption === 'highest-score') {
        sortedSubmissions.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    } else if (sortOption === 'lowest-score') {
        sortedSubmissions.sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
    }

    return sortedSubmissions.filter(sub => {
      const matchesFilter = 
          (filter === 'valid' && sub.status === 'valid') ||
          (filter === 'starred' && sub.isStarred) ||
          (filter === 'spam' && sub.status === 'spam');

      if (!matchesFilter) return false;

      if (searchTerm) {
        return Object.values(sub.data).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    });
  }, [submissions, filter, searchTerm, sortOption]);


  const handleDeleteSubmissions = async (submissionIds: string[]) => {
    if (!formId) return;
    
    const originalSubmissions = [...submissions];
    const newSubmissions = submissions.filter(sub => !submissionIds.includes(sub.id));
    setSubmissions(newSubmissions);

    const results = await Promise.all(submissionIds.map(id => deleteSubmission(formId, id)));
    const failedDeletions = results.filter(res => !res.success);

    if (failedDeletions.length > 0) {
      toast({
        title: `Error deleting ${failedDeletions.length} submission(s)`,
        description: "Some submissions could not be deleted.",
        variant: "destructive",
      });
      setSubmissions(originalSubmissions);
    } else {
      toast({
        title: "Submissions Deleted",
        description: `${submissionIds.length} submission(s) have been deleted.`,
      });
      setSelectedSubmissionIds([]);
    }
  };

  const handleToggleStar = async (submissionId: string, isStarred?: boolean) => {
    if (!formId) return;
    const result = await updateSubmission(formId, submissionId, { isStarred: !isStarred });
    if (result.success) {
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, isStarred: !isStarred } : s));
      toast({ title: isStarred ? "Unstarred" : "Starred" });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleMarkAsSpam = async (submissionId: string) => {
     if (!formId) return;
     const result = await updateSubmission(formId, submissionId, { status: 'spam' });
     if (result.success) {
        // Optimistically remove from view if current filter is 'valid'
        if (filter === 'valid') {
            setSubmissions(prev => prev.filter(s => s.id !== submissionId));
        } else {
            setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: 'spam' } : s));
        }
        toast({ title: "Marked as Spam" });
     } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
     }
  };
  
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text':
      case 'textarea':
        return <UserIcon className="h-3 w-3 text-muted-foreground" />;
      case 'email':
        return <Mail className="h-3 w-3 text-muted-foreground" />;
      case 'select':
      case 'radio':
        return <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />;
      case 'checkbox':
        return <CheckSquareIcon className="h-3 w-3 text-muted-foreground" />;
      case 'scale':
        return <ScaleIcon className="h-3 w-3 text-muted-foreground" />;
      case 'signature':
        return <PenTool className="h-3 w-3 text-muted-foreground" />;
      case 'file':
        return <FileText className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const columns = useMemo(() => {
    return formFields
      .filter(f => !['heading', 'paragraph'].includes(f.type))
      .map(f => ({ id: f.instanceId, header: f.label || "Field", field: f }));
  }, [formFields]);


  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedSubmissionIds(checked === true ? filteredSubmissions.map(sub => sub.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedSubmissionIds(prev => checked ? [...prev, id] : prev.filter(subId => subId !== id));
  };
  
  const renderValueForExport = (value: any, fieldType: string | undefined, fieldId?: string): string => {
    // New handling for rating types
    if ((fieldType === 'rating' || fieldType === 'scale') && typeof value === 'number') {
        return String(value);
    }
    if (value && value instanceof Timestamp) {
      try { return format(value.toDate(), 'PP'); } catch (e) {}
    }
    if (value && typeof value.toDate === 'function') {
      try { return format(value.toDate(), 'PP'); } catch (e) {}
    }
    if (fieldType === 'signature') {
        return value ? 'Signed' : '-';
    }
    if (fieldType === 'file' && typeof value === 'string' && value.startsWith('https://firebasestorage.googleapis.com')) {
      try {
        const decodedUrl = decodeURIComponent(value);
        const parts = decodedUrl.split('%2F');
        const lastPart = parts[parts.length - 1];
        const fileName = lastPart.split('?')[0];
        return fileName;
      } catch (e) {
        return "file";
      }
    }
    if (typeof value === 'boolean') return value ? 'Yes' : '-';
    if (value === null || value === undefined || value === '') return '-';
    if (Array.isArray(value)) return value.join(', ');
    
    if (typeof value === 'object' && value !== null) {
      if (fieldId === 'country' && value.country) {
        const countryName = value.country.name || '';
        const stateName = value.state?.name || '';
        return [countryName, stateName].filter(Boolean).join(', ');
      }
      if (value.address1 || value.city) {
          const addressParts = [value.address1, value.address2, value.city, value.state?.name, value.zip, value.country?.name];
          return addressParts.filter(Boolean).join('\n');
      }
      if (value.day && value.month && value.year) return `${value.month}/${value.day}/${value.year}`;
      if (value.hour && value.minute && value.ampm) return `${value.hour}:${value.minute} ${value.ampm}`;
      const joined = Object.values(value).filter(v => v).join(' ');
      return joined || '-';
    }

    let strValue = String(value);
    
    if (!isNaN(Date.parse(strValue)) && new Date(strValue).getFullYear() > 1970) {
      try { return format(new Date(strValue), 'PP'); } catch (e) {}
    }
    return strValue;
  };

  const handleExportAllPDF = () => {
    if (filteredSubmissions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no submissions in the current view to export.",
      });
      return;
    }

    const doc = new jsPDF({ orientation: 'p' });

    const tableColumns = ["#", "Submission Time", "Submission Data"];
    
    const tableRows = filteredSubmissions.map((submission, index) => {
      const dataCellString = columns.map(col => {
        const question = col.header;
        const value = submission.data[col.id];
        const answer = renderValueForExport(value, col.field.type, col.field.id);
        if (answer === '-' || !answer) return null; // Don't show empty answers
        return `${question}:\n${answer}`;
      }).filter(Boolean).join('\n\n');

      return [
        index + 1, 
        format(submission.createdAt.toDate(), 'PP p'),
        dataCellString
      ];
    });


    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(`Submissions for: ${formName}`, 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Exported on: ${format(new Date(), 'PPpp')}`, 14, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [tableColumns],
      body: tableRows,
      theme: 'striped',
      headStyles: { 
        fillColor: [216, 19, 14],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
        fontSize: 9,
        overflow: 'linebreak',
        valign: 'top',
      },
      alternateRowStyles: {
        fillColor: [248, 248, 250],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 'auto' },
      }
    });
    
    const sanitizedFormName = formName.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
    const fileName = sanitizedFormName || 'form-submissions';
    doc.save(`${fileName}.pdf`);
  };

  const handleExportAllCSV = () => {
    if (filteredSubmissions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no submissions in the current view to export.",
      });
      return;
    }

    const escapeCsvCell = (cell: any) => {
      let strCell = String(cell);
      if (strCell.search(/("|,|\n)/g) >= 0) {
        strCell = `"${strCell.replace(/"/g, '""')}"`;
      }
      return strCell;
    };

    const headers = ["Submission Time", ...columns.map(col => col.header)];
    const csvRows = [
      headers.map(escapeCsvCell).join(','),
    ];

    filteredSubmissions.forEach((submission) => {
      const rowData = [
        format(submission.createdAt.toDate(), 'PP p'),
        ...columns.map(col => {
          const value = submission.data[col.id];
          return escapeCsvCell(renderValueForExport(value, col.field.type, col.field.id));
        })
      ];
      csvRows.push(rowData.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        const sanitizedFormName = formName.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
        const fileName = sanitizedFormName || 'form-submissions';
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  
  const handleExportPDF = (submission: Submission) => {
    const doc = new jsPDF({ orientation: 'p' });
  
    const tableColumns = ["Question", "Answer"];
    const tableRows = formFields
      .filter(field => !['heading', 'paragraph'].includes(field.type))
      .map(field => {
        const question = field.label || field.name;
        const value = submission.data[field.instanceId];
        const answer = renderValueForExport(value, field.type, field.id);
        return [question, answer];
      });
  
    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(`Submission for: ${formName}`, 14, 22);
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Submitted on: ${format(submission.createdAt.toDate(), 'PPpp')}`, 14, 30);
  
    // Table with styling
    autoTable(doc, {
      startY: 40,
      head: [tableColumns],
      body: tableRows.filter(row => row[1] !== '-'), // Filter out unanswered questions
      theme: 'striped',
      headStyles: {
        fillColor: [216, 19, 14], // Red color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
        fontSize: 9,
        overflow: 'linebreak',
      },
      alternateRowStyles: {
        fillColor: [248, 248, 250],
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
      didDrawCell: (data) => {
        // Find the original field to check its type
        const field = formFields.find(f => (f.label || f.name) === data.row.raw[0]);
        if (field && (field.type === 'url' || field.type === 'file')) {
          const rawValue = submission.data[field.instanceId];
          if (typeof rawValue === 'string' && rawValue.startsWith('http')) {
            const text = data.cell.text as string | string[];
            const url = rawValue;
            const textArray = Array.isArray(text) ? text : [text];
            const textHeight = doc.getTextDimensions(textArray).h;
            
            doc.setTextColor(216, 19, 14); // Use main color
            const textY = data.cell.y + data.cell.height / 2 - textHeight / 2;

            // Draw text first, then add invisible link area
            doc.text(textArray, data.cell.x + data.cell.padding('left'), textY, { baseline: 'top' });
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: url });
            
            // Reset text color
            doc.setTextColor(40,40,40);

            // Prevent autoTable from drawing the text again
            data.cell.text = '';
          }
        }
      }
    });
  
    // Save logic
    const sanitizedFormName = formName.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
    doc.save(`submission_${sanitizedFormName}_${submission.id.substring(0, 6)}.pdf`);
  };

  const allOnPageSelected = filteredSubmissions.length > 0 && selectedSubmissionIds.length === filteredSubmissions.length;
  const someOnPageSelected = selectedSubmissionIds.length > 0 && !allOnPageSelected;

  const renderValue = (value: any, field: FormFieldInstance | { type?: string; id?: string, maxRating?: number }, submission: Submission) => {
    const fieldType = field.type;
    const originalId = field.id;
    
    if (value && value instanceof Timestamp) {
      try {
          return format(value.toDate(), 'PP');
      } catch(e) {
          return "Invalid Date";
      }
    }
    if (value && typeof value.toDate === 'function') {
        try {
            return format(value.toDate(), 'PP');
        } catch(e) {
            return "Invalid Date";
        }
    }

    if (fieldType === 'terms') {
      return value ? (
        <div className="flex items-center gap-1.5 text-green-700 font-medium text-sm">
          <Check className="h-5 w-5 text-green-600" />
          <span>Agreed</span>
        </div>
      ) : (
        <span className="text-muted-foreground/70">-</span>
      );
    }

    if (value === null || value === undefined || value === '') {
        return <span className="text-muted-foreground/70">-</span>;
    }

    if (fieldType === 'file' && typeof value === 'string' && value.startsWith('https://')) {
        const fileName = decodeURIComponent(value.split('%2F').pop()?.split('?')[0] || 'File');
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
        return (
             <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-muted/50 border rounded-md px-2 py-1 text-sm text-foreground hover:bg-muted">
                {isImage ? <FileImage className="h-4 w-4 text-muted-foreground"/> : <FileText className="h-4 w-4 text-muted-foreground"/>}
                <span className="truncate max-w-[150px]">{fileName}</span>
            </a>
        );
    }
    
    if (fieldType === 'signature' && typeof value === 'string' && value.startsWith('data:image')) {
        return (
            <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:underline">
                <CheckCircle className="h-5 w-5" />
                <span>Signed</span>
            </a>
        );
    }

    if (fieldType === 'checkbox' && Array.isArray(value)) {
        const colors = ['bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800'];
        const displayLimit = 3;
        const itemsToDisplay = value.slice(0, displayLimit);
        const remainingCount = value.length - displayLimit;

        return (
            <div className="flex flex-wrap items-center gap-1.5">
                {itemsToDisplay.map((item, index) => (
                    <Badge key={index} variant="outline" className={`font-normal border-transparent ${colors[index % colors.length]}`}>{item}</Badge>
                ))}
                {remainingCount > 0 && (
                    <button
                        onClick={() => setViewingSubmission(submission)}
                        className="text-xs text-primary hover:underline font-medium"
                    >
                        +{remainingCount} more
                    </button>
                )}
            </div>
        )
    }

    if (fieldType === 'rating' && typeof value === 'number') {
        const maxRating = field.maxRating || 5;
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                    {[...Array(maxRating)].map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < value ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')} />
                    ))}
                </div>
                <span className="text-muted-foreground font-medium text-sm"> – {value}</span>
            </div>
        );
    }
    
    if (fieldType === 'scale' && typeof value === 'number') {
        return <span className="text-muted-foreground font-medium">{value}</span>
    }
    
     if (fieldType === 'url' && typeof value === 'string' && value.startsWith('http')) {
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1.5"><LinkIcon className="h-4 w-4" /> Link</a>
     }

    if (typeof value === 'object' && value !== null) {
      if (originalId === 'country') {
        return (
          <div className="flex items-center gap-2">
            <span>{value.flag}</span>
            <span className="truncate">{value.name}</span>
          </div>
        );
      }
      if (originalId === 'name' && (value.firstName || value.middleName || value.lastName)) {
        const nameParts = [
          value.firstName,
          value.middleName,
          value.lastName,
        ].filter(Boolean).join(' ');

        if (nameParts.length === 0) {
           return <span className="text-muted-foreground/70">-</span>;
        }

        return nameParts;
      }
      if (originalId === 'address') {
        const addressParts = [value.address1, value.address2, value.city, value.state?.name, value.zip, value.country?.name];
        
        if (addressParts.every(v => v === null || v === undefined || v === '')) {
            return <span className="text-muted-foreground/70">-</span>;
        }
        return addressParts.filter(Boolean).join(', ');
      }
      if (value.hour && value.minute && value.ampm) {
          return `${value.hour}:${value.minute} ${value.ampm}`;
      }
      if (value.day && value.month && value.year) {
        return `${value.month}/${value.day}/${value.year}`;
      }
      return Object.values(value).filter(v => v).join(', ');
    }

    if (Array.isArray(value)) return value.join(', ');

    let strValue = String(value);

    if (strValue.length > 50) {
        return (
            <div>
                <span className="text-muted-foreground">{`${strValue.substring(0, 50)}...`}</span>
                <button
                  onClick={() => setViewingSubmission(submission)}
                  className="text-primary text-xs ml-1 hover:underline font-medium"
                >
                  read more
                </button>
            </div>
        )
    }

    if (!isNaN(Date.parse(strValue)) && new Date(strValue).getFullYear() > 1970) {
      try { return format(new Date(strValue), 'PP'); } catch (e) {}
    }
    
    return strValue;
  };


  return (
    <div className="flex-1 flex flex-col bg-background mt-0 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 h-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{filter.charAt(0).toUpperCase() + filter.slice(1)} Submissions</span>
                    <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as any)}>
                <DropdownMenuRadioItem value="valid">Valid Submissions</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="starred">Starred</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="spam">Spam</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          {selectedSubmissionIds.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-9">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedSubmissionIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete {selectedSubmissionIds.length} submission(s). This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteSubmissions(selectedSubmissionIds)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Upload className="mr-2 h-4 w-4" />
                <span>Export</span>
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportAllPDF}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAllCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                <span>Export as CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
           
        </div>
      </div>

      <div className="flex-1 overflow-auto">
         {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
         ) : filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Inbox className="h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground">No Submissions Found</h3>
                <p className="max-w-xs">{searchTerm || filter !== 'valid' ? "Your search or filter did not return any results." : "Once your form is published and receives responses, they will appear here."}</p>
            </div>
         ) : (
            <div className="border-t">
                <Table className="min-w-full">
                <TableHeader className="bg-muted/20">
                    <TableRow>
                    <TableHead className="w-12 px-3 sticky left-0 bg-muted/20 z-10">
                        <Checkbox
                            checked={allOnPageSelected ? true : (someOnPageSelected ? 'indeterminate' : false)}
                            onCheckedChange={handleSelectAll}
                        />
                    </TableHead>
                    <TableHead className="w-12 px-3"><Star className="h-4 w-4 text-muted-foreground"/></TableHead>
                    <TableHead className="font-semibold text-foreground whitespace-nowrap px-3 py-3.5 text-sm">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-1 cursor-pointer">
                                    {sortOption === 'newest' && <>Submission time <ArrowDown className="h-3 w-3" /></>}
                                    {sortOption === 'oldest' && <>Submission time <ArrowUp className="h-3 w-3" /></>}
                                    {sortOption.includes('score') && 'Submission time'}
                                </div>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}>
                                    <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableHead>
                     <TableHead className="w-28 font-semibold text-foreground whitespace-nowrap px-3 py-3.5 text-sm">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-1 cursor-pointer">
                                    <Award className="h-4 w-4 mr-1" />
                                    {sortOption === 'highest-score' && <>Score <ArrowDown className="h-3 w-3" /></>}
                                    {sortOption === 'lowest-score' && <>Score <ArrowUp className="h-3 w-3" /></>}
                                    {!sortOption.includes('score') && 'Score'}
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Sort by Score</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}>
                                    <DropdownMenuRadioItem value="highest-score">Highest Score</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="lowest-score">Lowest Score</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                     </TableHead>
                    {columns.map(col => (
                        <TableHead key={col.id} className="font-semibold text-foreground whitespace-nowrap px-3 py-3.5 text-sm">
                          {col.header}
                        </TableHead>
                    ))}
                    <TableHead className="w-20 text-right pr-4 sticky right-0 bg-muted/20 z-10">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredSubmissions.map((submission) => (
                    <TableRow
                        key={submission.id}
                        data-state={selectedSubmissionIds.includes(submission.id) ? "selected" : ""}
                        className="hover:bg-muted/10 data-[state=selected]:bg-primary/10"
                    >
                        <TableCell className="px-3 py-4 sticky left-0 bg-card data-[state=selected]:bg-primary/10 z-10 align-top">
                        <div className="flex items-center">
                            <div className={cn("absolute left-0 top-0 h-full w-1 transition-colors", selectedSubmissionIds.includes(submission.id) ? "bg-primary" : "bg-transparent")}></div>
                            <Checkbox
                                checked={selectedSubmissionIds.includes(submission.id)}
                                onCheckedChange={(checked) => handleSelectRow(submission.id, !!checked)}
                            />
                        </div>
                        </TableCell>
                        <TableCell className="px-3 py-4 align-top">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleStar(submission.id, submission.isStarred)}>
                            <Star className={cn("h-4 w-4", submission.isStarred ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/60")} />
                            </Button>
                        </TableCell>
                         <TableCell className="text-sm px-3 py-4 align-top">
                           <div>{format(submission.createdAt.toDate(), 'MMM d, yyyy, hh:mm a')}</div>
                           <div className="text-xs text-muted-foreground">{formatDistanceToNow(submission.createdAt.toDate(), { addSuffix: true })}</div>
                        </TableCell>
                        <TableCell className="px-3 py-4 align-top">
                             {editingScoreId === submission.id ? (
                                <Input
                                    type="number"
                                    defaultValue={submission.score ?? ''}
                                    onBlur={(e) => handleScoreChange(submission.id, e.target.value === '' ? null : Number(e.target.value))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                    className="h-8 w-20 text-center bg-muted/20"
                                    min={0}
                                    max={100}
                                    autoFocus
                                />
                            ) : (
                                <div onClick={() => setEditingScoreId(submission.id)} className="cursor-pointer h-8 flex items-center justify-center w-20 rounded-md hover:bg-muted">
                                    {submission.score === null || submission.score === undefined ? (
                                        <span className="text-muted-foreground italic text-xs">No score</span>
                                    ) : (
                                        <span className="font-medium text-foreground">{submission.score}</span>
                                    )}
                                </div>
                            )}
                        </TableCell>
                        {columns.map(col => (
                        <TableCell key={col.id} className="text-muted-foreground text-sm px-3 py-4 align-top">
                            {renderValue(submission.data[col.id], col.field, submission)}
                        </TableCell>
                        ))}
                        <TableCell className="text-right pr-4 sticky right-0 bg-card data-[state=selected]:bg-primary/10 z-10 align-top">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => setViewingSubmission(submission)}>
                                <FileText className="mr-2 h-4 w-4"/> View Submission
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportPDF(submission)}>
                                <Download className="mr-2 h-4 w-4"/>Download as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAsSpam(submission.id)}>
                                <ShieldAlert className="mr-2 h-4 w-4"/>Mark as Spam
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            onSelect={(e) => e.preventDefault()}
                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will permanently delete this submission. This cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteSubmissions([submission.id])}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
         )}
      </div>
       <SubmissionDetailSidebar
        isOpen={!!viewingSubmission}
        onClose={() => setViewingSubmission(null)}
        submission={viewingSubmission}
        formFields={formFields}
        formName={formName}
        onUpdate={handleUpdateSubmissionData}
        onExportPDF={() => { if(viewingSubmission) handleExportPDF(viewingSubmission) }}
        onMarkAsSpam={() => { if(viewingSubmission) handleMarkAsSpam(viewingSubmission.id) }}
        onDelete={() => { if(viewingSubmission) handleDeleteSubmissions([viewingSubmission.id]) }}
      />
    </div>
  );
}
