"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isPositiveInt } from "@/app/lib/numbers";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import {
  associateBusinessTwilioPhoneNumber,
  getBusinessTwilioPhoneNumbers,
  type AssociatedTwilioPhoneNumber,
  type TwilioPhoneNumbersResponse,
} from "@/app/services/business/twilio-phone-numbers";

const EMPTY_TWILIO_NUMBERS: TwilioPhoneNumbersResponse = {
  numbers: [],
  selectedPhoneSid: null,
  selectedPhoneNumber: null,
};

export function useBusinessTwilioPhoneNumbersQuery(
  businessId: number | null | undefined,
  options?: { enabled?: boolean },
) {
  const enabled =
    (options?.enabled ?? true) &&
    isPositiveInt(businessId ?? 0) &&
    hasAuthSession();

  const query = useQuery({
    queryKey: isPositiveInt(businessId ?? 0)
      ? businessQueryKeys.twilioPhoneNumbers(businessId as number)
      : ([...businessQueryKeys.all, "twilio-phone-numbers", "idle"] as const),
    queryFn: () => getBusinessTwilioPhoneNumbers(businessId as number),
    enabled,
    staleTime: 60_000,
  });

  return {
    data: query.data ?? EMPTY_TWILIO_NUMBERS,
    numbers: query.data?.numbers ?? EMPTY_TWILIO_NUMBERS.numbers,
    selectedPhoneSid: query.data?.selectedPhoneSid ?? null,
    selectedPhoneNumber: query.data?.selectedPhoneNumber ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPending: query.isPending,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load Twilio phone numbers.")
      : null,
    refetch: query.refetch,
  };
}

export function useAssociateBusinessTwilioPhoneNumberMutation(
  businessId: number,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { phoneSid: string; phoneNumber: string }) =>
      associateBusinessTwilioPhoneNumber(businessId, body),
    onSuccess: (result: AssociatedTwilioPhoneNumber) => {
      queryClient.setQueryData<TwilioPhoneNumbersResponse>(
        businessQueryKeys.twilioPhoneNumbers(businessId),
        (current) => ({
          numbers: current?.numbers ?? [],
          selectedPhoneSid: result.twilioPhoneSid,
          selectedPhoneNumber: result.twilioPhoneNumber,
        }),
      );
      void queryClient.invalidateQueries({
        queryKey: businessQueryKeys.twilioPhoneNumbers(businessId),
      });
    },
  });
}
