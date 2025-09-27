'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { LearningRecordForm } from './components/LearningRecordForm';
import { LearningRecordList } from './components/LearningRecordList';

interface LearningRecord {
  id: string;
  studentId: string;
  date: string;
  summary: string;
  durationMin: number;
  goodPoints: string | null;
  improvementPoints: string | null;
  homework: string | null;
  studentLate: boolean;
  tutorLate: boolean;
  additionalNotes: string | null;
}

export default function TutorRecordsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingRecord, setEditingRecord] = useState<LearningRecord | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  const handleRecordCreated = () => {
    setShowForm(false);
    setEditingRecord(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (record: any) => {
    setEditingRecord({
      id: record.id,
      studentId: record.student?.id || '',
      date: record.date,
      summary: record.summary,
      durationMin: record.durationMin,
      goodPoints: record.goodPoints,
      improvementPoints: record.improvementPoints,
      homework: record.homework,
      studentLate: record.studentLate,
      tutorLate: record.tutorLate,
      additionalNotes: record.additionalNotes,
    });
    setShowForm(true);
  };

  const handleDeleteRequest = (recordId: string) => {
    setDeletingRecordId(recordId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    setDeletingRecordId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNewRecord = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">学習記録</h1>
          <p className="text-gray-600 mt-2">生徒の学習記録を管理します</p>
        </div>
        <Button
          onClick={handleNewRecord}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新規記録作成
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? '学習記録編集' : '新規学習記録作成'}
            </DialogTitle>
          </DialogHeader>
          <LearningRecordForm
            onSuccess={handleRecordCreated}
            onCancel={() => setShowForm(false)}
            editingRecord={editingRecord}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>学習記録を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消すことができません。学習記録を完全に削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LearningRecordList
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />
    </div>
  );
}