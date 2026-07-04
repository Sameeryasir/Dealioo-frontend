"use client";

import BookMeetingForm from "@/app/components/book-meeting/BookMeetingForm";
import type { MeetingFormValues } from "@/app/components/book-meeting/book-meeting-config";
import { submitMeetingRequest } from "@/app/services/meeting/submitMeetingRequest";
import { useCallback, useState } from "react";

export default function BookMeetingPage() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = useCallback(async (values: MeetingFormValues) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await submitMeetingRequest(values);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not submit your request.";
      setErrorMessage(message);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return (
    <BookMeetingForm
      submitting={submitting}
      errorMessage={errorMessage}
      onSubmit={onSubmit}
    />
  );
}
