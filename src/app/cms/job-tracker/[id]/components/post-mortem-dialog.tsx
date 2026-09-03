"use client";

import { useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface PostMortemData {
  stageFailedAt: string;
  primaryReason: string;
  recruiterFeedback: string;
  lessonsLearned: string;
}

interface PostMortemDialogProps {
  isOpen: boolean;
  companyName: string;
  jobTitle: string;
  initialData?: Partial<PostMortemData>;
  onClose: () => void;
  onSave: (data: PostMortemData) => Promise<void>;
}

export function PostMortemDialog({
  isOpen,
  companyName,
  jobTitle,
  initialData,
  onClose,
  onSave,
}: PostMortemDialogProps) {
  const [stageFailedAt, setStageFailedAt] = useState(
    initialData?.stageFailedAt || "technical_interview"
  );
  const [primaryReason, setPrimaryReason] = useState(
    initialData?.primaryReason || "Skill / Tech Stack Mismatch"
  );
  const [recruiterFeedback, setRecruiterFeedback] = useState(initialData?.recruiterFeedback || "");
  const [lessonsLearned, setLessonsLearned] = useState(initialData?.lessonsLearned || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave({
        stageFailedAt,
        primaryReason,
        recruiterFeedback,
        lessonsLearned,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Application Post-Mortem & Reflection</DialogTitle>
              <DialogDescription className="text-xs">
                Log feedback and self-reflection for <strong>{jobTitle}</strong> at{" "}
                <strong>{companyName}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="stageFailed" className="text-xs">
              Final Stage Reached
            </Label>
            <Select value={stageFailedAt} onValueChange={setStageFailedAt}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resume_screening">CV / Initial Screening</SelectItem>
                <SelectItem value="hr_interview">HR Screening</SelectItem>
                <SelectItem value="take_home_test">Take-Home Challenge</SelectItem>
                <SelectItem value="technical_interview">Technical / Live Coding</SelectItem>
                <SelectItem value="system_design">System Design</SelectItem>
                <SelectItem value="user_interview">User / Team Lead</SelectItem>
                <SelectItem value="final_leadership">Executive Leadership</SelectItem>
                <SelectItem value="offering_stage">Offering Negotiation</SelectItem>
                <SelectItem value="ghosted_no_reply">Ghosted / No Reply</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reasonCategory" className="text-xs">
              Primary Factor
            </Label>
            <Select value={primaryReason} onValueChange={setPrimaryReason}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Skill / Tech Stack Mismatch">
                  Skill / Tech Stack Alignment
                </SelectItem>
                <SelectItem value="Found more senior candidate">
                  Found Candidate with More Domain Experience
                </SelectItem>
                <SelectItem value="Salary budget mismatch">Salary / Budget Mismatch</SelectItem>
                <SelectItem value="Cultural / Communication Fit">
                  Communication / Cultural Fit
                </SelectItem>
                <SelectItem value="Position Cancelled / Hiring Freeze">
                  Headcount Frozen / Position Cancelled
                </SelectItem>
                <SelectItem value="Ghosted / Recruiter Stopped Responding">
                  No Response / Recruiter Ghosted
                </SelectItem>
                <SelectItem value="Other">Other Reason</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recruiterFeedback" className="text-xs">
              Recruiter / Interviewer Feedback
            </Label>
            <Textarea
              id="recruiterFeedback"
              rows={3}
              placeholder="What specific feedback or reason did the company share (if any)?"
              value={recruiterFeedback}
              onChange={(e) => setRecruiterFeedback(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="lessonsLearned"
              className="text-xs flex items-center gap-1.5 text-primary font-bold"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Key Lesson & Next Improvement (Action Item)
            </Label>
            <Textarea
              id="lessonsLearned"
              rows={3}
              placeholder="e.g. Review GraphQL caching strategies before next interview; clarify salary range earlier in the HR screening round..."
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              className="text-xs bg-primary/5 border-primary/20"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Save Post-Mortem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
