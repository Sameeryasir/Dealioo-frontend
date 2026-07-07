"use client";
import { BookMeetingCommitmentStep } from "@/app/components/book-meeting/BookMeetingCommitmentStep";
import { BookMeetingTimelineStep } from "@/app/components/book-meeting/BookMeetingTimelineStep";
import styles from "./BookMeetingForm.module.css";

export type BookMeetingFinalStepProps = {
  startTimeline: string;
  meetingCommitment: string;
  onTimelineChange: (value: string) => void;
  onCommitmentChange: (value: string) => void;
};

export function BookMeetingFinalStep({
  startTimeline,
  meetingCommitment,
  onTimelineChange,
  onCommitmentChange,
}: BookMeetingFinalStepProps) {
  return (
    <div className={styles.finalStep}>
      <BookMeetingTimelineStep value={startTimeline} onChange={onTimelineChange} />

      <section className={styles.finalStepSection}>
        <p className={styles.finalStepQuestion}>Will you come prepared for the call?</p>
        <BookMeetingCommitmentStep value={meetingCommitment} onChange={onCommitmentChange} />
      </section>
    </div>
  );
}
