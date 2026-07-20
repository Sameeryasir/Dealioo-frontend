"use client";

import Navbar from "@/app/components/Navbar";
import { InviteMemberForm } from "@/app/components/business/InviteMemberModal";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import inviteStyles from "@/app/components/register-business/RegisterBusinessInviteStep.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { getBusinessMembers } from "@/app/services/member/business-members";
import { businessMemberQueryKeys } from "@/app/services/member/member-query-keys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Loader2, Users } from "lucide-react";

export type RegisterBusinessInviteStepProps = {
  businessId: number;
  businessName: string;
  onContinue: () => void;
  onBack?: () => void;
};

export default function RegisterBusinessInviteStep({
  businessId,
  businessName,
  onContinue,
  onBack,
}: RegisterBusinessInviteStepProps) {
  const reduced = useReducedMotion();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: businessMemberQueryKeys.list(businessId),
    queryFn: () => getBusinessMembers(businessId),
    staleTime: 30_000,
  });

  const members = membersQuery.data?.members ?? [];

  return (
    <div
      className={`landing-page ${bookStyles.shell}`}
      data-register-business-page
      data-register-business-invite
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main
          id="register-business-invite"
          className={`${bookStyles.main} ${inviteStyles.main}`}
        >
          <div className={`${bookStyles.formZone} ${inviteStyles.inviteZone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>Invite your team</span>
              <span className={bookStyles.progressPct}>Optional</span>
            </div>

            <div className={bookStyles.progressTrack} aria-hidden>
              <motion.div
                className={bookStyles.progressFill}
                initial={false}
                animate={{ width: "100%" }}
                transition={{ duration: 0.4, ease: easeOut }}
              />
            </div>

            <div className={inviteStyles.layout}>
              <motion.div
                className={inviteStyles.column}
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: easeOut }}
              >
                <header className={inviteStyles.header}>
                  <span className={inviteStyles.stepBadge}>
                    <Users className="h-4 w-4" aria-hidden />
                  </span>
                  <h2 className={inviteStyles.title}>
                    Invite{" "}
                    <span className="landing-hero-accent-blue">members</span>
                  </h2>
                  <p className={inviteStyles.subtitle}>
                    Invite your team to join{" "}
                    <strong>{businessName || "your organization"}</strong>. Choose
                    a role and permissions, then send the invite — or skip and do
                    this later from settings.
                  </p>
                </header>

                <InviteMemberForm
                  businessId={businessId}
                  variant="inline"
                  onSuccess={() => {
                    void queryClient.invalidateQueries({
                      queryKey: businessMemberQueryKeys.list(businessId),
                    });
                  }}
                />

                <div className={inviteStyles.panel}>
                  <section className={inviteStyles.cardTop}>
                    <div className={inviteStyles.cardTopHead}>
                      <div>
                        <h3 className={inviteStyles.cardTitle}>Team members</h3>
                        <p className={inviteStyles.cardHint}>
                          {membersQuery.isLoading
                            ? "Loading members…"
                            : `${members.length} member${members.length === 1 ? "" : "s"} on this business.`}
                        </p>
                      </div>
                    </div>

                    {membersQuery.isLoading ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Loading members…
                      </div>
                    ) : (
                      <ul className={inviteStyles.memberList}>
                        {members.map((member) => (
                          <li
                            key={
                              member.id != null
                                ? `member-${member.id}`
                                : `member-${member.email}`
                            }
                            className={inviteStyles.memberRow}
                          >
                            <span
                              className={
                                member.status === "pending"
                                  ? inviteStyles.avatarPending
                                  : inviteStyles.avatar
                              }
                              aria-hidden
                            >
                              {(
                                member.name.trim().charAt(0) ||
                                member.email.charAt(0) ||
                                "?"
                              ).toUpperCase()}
                            </span>
                            <div className={inviteStyles.memberMeta}>
                              <span className={inviteStyles.memberName}>
                                {member.name.trim() || member.email}
                              </span>
                              <span className={inviteStyles.memberEmail}>
                                {member.email}
                                {member.role ? ` · ${member.role}` : ""}
                              </span>
                            </div>
                            <span
                              className={
                                member.status === "pending"
                                  ? inviteStyles.pendingBadge
                                  : inviteStyles.ownerBadge
                              }
                            >
                              {member.status === "owner"
                                ? "Owner"
                                : member.status === "pending"
                                  ? "Pending"
                                  : "Active"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>

                <div className={inviteStyles.actions}>
                  {onBack ? (
                    <button
                      type="button"
                      className={inviteStyles.backBtn}
                      onClick={onBack}
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Back
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={inviteStyles.skipBtn}
                    onClick={onContinue}
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    className={inviteStyles.continueBtn}
                    onClick={onContinue}
                  >
                    Continue to dashboard
                  </button>
                </div>
              </motion.div>

              <aside className={inviteStyles.sidebar} aria-label="Good to know">
                <div className={inviteStyles.sidebarInner}>
                  <p className={inviteStyles.sidebarEyebrow}>Good to know</p>
                  <div className={inviteStyles.sidebarBlock}>
                    <h3 className={inviteStyles.sidebarTitle}>How invites work</h3>
                    <p className={inviteStyles.sidebarText}>
                      If they already have an account, they&apos;ll be added. If
                      not, they&apos;ll get an email invitation to join.
                    </p>
                  </div>
                  <div className={inviteStyles.sidebarBlock}>
                    <h3 className={inviteStyles.sidebarTitle}>Manage anytime</h3>
                    <p className={inviteStyles.sidebarText}>
                      Invite more people later from Organization → Members in
                      settings.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
