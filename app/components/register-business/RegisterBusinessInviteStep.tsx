"use client";

import Navbar from "@/app/components/Navbar";
import { SettingsSelectDropdown } from "@/app/components/automation/builder/SettingsSelectDropdown";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import inviteStyles from "@/app/components/register-business/RegisterBusinessInviteStep.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { getDefaultPermissionsForRole } from "@/app/lib/member-permissions";
import { inviteBusinessMember } from "@/app/services/member/business-members";
import {
  BUSINESS_MEMBER_ROLES,
  type BusinessMemberRole,
} from "@/app/services/member/types";
import { getMyProfile } from "@/app/services/user/profile";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";

export type RegisterBusinessInviteStepProps = {
  businessId: number;
  businessName: string;
  onContinue: () => void;
  onBack?: () => void;
};

type LocalInvite = {
  email: string;
  role: BusinessMemberRole;
};

type ListTab = "members" | "invitations";

function isValidInviteEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function avatarLetter(value: string): string {
  const trimmed = value.trim();
  return (trimmed[0] ?? "?").toUpperCase();
}

export default function RegisterBusinessInviteStep({
  businessId,
  businessName,
  onContinue,
  onBack,
}: RegisterBusinessInviteStepProps) {
  const reduced = useReducedMotion();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BusinessMemberRole>("Manager");
  const [ownerName, setOwnerName] = useState("You");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [sentInvites, setSentInvites] = useState<LocalInvite[]>([]);
  const [listTab, setListTab] = useState<ListTab>("members");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOwner() {
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        if (profile.name?.trim()) setOwnerName(profile.name.trim());
        if (profile.email?.trim()) setOwnerEmail(profile.email.trim());
      } catch {
      }
    }

    void loadOwner();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendInvite = useCallback(async () => {
    const trimmedEmail = email.trim().toLowerCase();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isValidInviteEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (sentInvites.some((invite) => invite.email === trimmedEmail)) {
      setErrorMessage("You already invited this email.");
      return;
    }

    if (ownerEmail && trimmedEmail === ownerEmail.trim().toLowerCase()) {
      setErrorMessage("You can't invite yourself.");
      return;
    }

    setSending(true);
    try {
      await inviteBusinessMember({
        businessId,
        email: trimmedEmail,
        role,
        permissions: getDefaultPermissionsForRole(role),
      });

      setSentInvites((current) => [...current, { email: trimmedEmail, role }]);
      setEmail("");
      setSuccessMessage(`Invitation sent to ${trimmedEmail}.`);
      setListTab("invitations");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not send the invitation. Try again.",
      );
    } finally {
      setSending(false);
    }
  }, [businessId, email, ownerEmail, role, sentInvites]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      void sendInvite();
    },
    [sendInvite],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      void sendInvite();
    },
    [sendInvite],
  );

  const canSend = email.trim().length > 0 && !sending;
  const memberCount = 1 + sentInvites.length;

  const roleOptions = useMemo(
    () =>
      BUSINESS_MEMBER_ROLES.map((option) => ({
        value: option,
        label: option,
      })),
    [],
  );

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
                    <strong>{businessName || "your organization"}</strong>. You can
                    skip this and invite people later from settings.
                  </p>
                </header>

                <div className={inviteStyles.panel}>
                  <section className={inviteStyles.cardTop}>
                    <div className={inviteStyles.cardTopHead}>
                      <div>
                        <h3 className={inviteStyles.cardTitle}>Send an invitation</h3>
                        <p className={inviteStyles.cardHint}>
                          Existing accounts join right away. New users get an email
                          invite.
                        </p>
                      </div>
                    </div>

                    <form className={inviteStyles.inviteForm} onSubmit={handleSubmit}>
                      <label className={inviteStyles.fieldGrow}>
                        <span className={inviteStyles.fieldLabel}>Email address</span>
                        <div className={inviteStyles.inputWrap}>
                          <Mail className={inviteStyles.inputIcon} aria-hidden />
                          <input
                            type="email"
                            autoComplete="email"
                            autoFocus
                            className={inviteStyles.inputWithIcon}
                            placeholder="colleague@email.com"
                            value={email}
                            disabled={sending}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setErrorMessage(null);
                              setSuccessMessage(null);
                            }}
                            onKeyDown={handleKeyDown}
                          />
                        </div>
                      </label>

                      <div className={inviteStyles.fieldRole}>
                        <span className={inviteStyles.fieldLabel}>Role</span>
                        <div className={inviteStyles.roleDropdown}>
                          <SettingsSelectDropdown
                            value={role}
                            options={roleOptions}
                            onChange={(nextRole) =>
                              setRole(nextRole as BusinessMemberRole)
                            }
                            ariaLabel="Role"
                            locked={sending}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className={`${inviteStyles.sendBtn}${
                          canSend ? ` ${inviteStyles.sendBtnReady}` : ""
                        }`}
                        disabled={!canSend}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" aria-hidden />
                            Send invite
                          </>
                        )}
                      </button>
                    </form>

                    {errorMessage ? (
                      <div className={inviteStyles.alertError} role="alert">
                        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                        <span>{errorMessage}</span>
                      </div>
                    ) : null}

                    {successMessage ? (
                      <div className={inviteStyles.alertSuccess} role="status">
                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                        <span>{successMessage}</span>
                      </div>
                    ) : null}
                  </section>

                  <section className={inviteStyles.cardBottom}>
                    <div className={inviteStyles.tabs} role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={listTab === "members"}
                        className={
                          listTab === "members"
                            ? inviteStyles.tabActive
                            : inviteStyles.tabMuted
                        }
                        onClick={() => setListTab("members")}
                      >
                        Members ({memberCount})
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={listTab === "invitations"}
                        className={
                          listTab === "invitations"
                            ? inviteStyles.tabActive
                            : inviteStyles.tabMuted
                        }
                        onClick={() => setListTab("invitations")}
                      >
                        Invitations ({sentInvites.length})
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {listTab === "members" ? (
                        <motion.ul
                          key="members"
                          className={inviteStyles.memberList}
                          initial={reduced ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduced ? undefined : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.2, ease: easeOut }}
                        >
                          <li className={inviteStyles.memberRow}>
                            <span className={inviteStyles.avatar} aria-hidden>
                              {avatarLetter(ownerName)}
                            </span>
                            <div className={inviteStyles.memberMeta}>
                              <span className={inviteStyles.memberName}>
                                {ownerName}
                              </span>
                              <span className={inviteStyles.memberEmail}>
                                {ownerEmail || "Owner"}
                              </span>
                            </div>
                            <span className={inviteStyles.ownerBadge}>Owner</span>
                          </li>

                          {sentInvites.map((invite) => (
                            <li key={invite.email} className={inviteStyles.memberRow}>
                              <span className={inviteStyles.avatarPending} aria-hidden>
                                {avatarLetter(invite.email)}
                              </span>
                              <div className={inviteStyles.memberMeta}>
                                <span className={inviteStyles.memberName}>
                                  {invite.email}
                                </span>
                                <span className={inviteStyles.memberEmail}>
                                  Pending · {invite.role}
                                </span>
                              </div>
                              <span className={inviteStyles.pendingBadge}>Pending</span>
                            </li>
                          ))}
                        </motion.ul>
                      ) : (
                        <motion.div
                          key="invitations"
                          initial={reduced ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduced ? undefined : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.2, ease: easeOut }}
                        >
                          {sentInvites.length === 0 ? (
                            <div className={inviteStyles.emptyState}>
                              <Mail className="h-5 w-5" aria-hidden />
                              <p>No invitations sent yet</p>
                              <span>
                                Add an email above to invite someone to your team.
                              </span>
                            </div>
                          ) : (
                            <ul className={inviteStyles.memberList}>
                              {sentInvites.map((invite) => (
                                <li
                                  key={invite.email}
                                  className={inviteStyles.memberRow}
                                >
                                  <span
                                    className={inviteStyles.avatarPending}
                                    aria-hidden
                                  >
                                    {avatarLetter(invite.email)}
                                  </span>
                                  <div className={inviteStyles.memberMeta}>
                                    <span className={inviteStyles.memberName}>
                                      {invite.email}
                                    </span>
                                    <span className={inviteStyles.memberEmail}>
                                      Role · {invite.role}
                                    </span>
                                  </div>
                                  <span className={inviteStyles.pendingBadge}>
                                    Pending
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                </div>

                <div className={inviteStyles.actions}>
                  {onBack ? (
                    <button
                      type="button"
                      className={inviteStyles.backBtn}
                      onClick={onBack}
                      disabled={sending}
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Back
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={inviteStyles.skipBtn}
                    onClick={onContinue}
                    disabled={sending}
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    className={inviteStyles.continueBtn}
                    onClick={onContinue}
                    disabled={sending}
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
                      If they already have an account, they&apos;ll be added. If not,
                      they&apos;ll get an email invitation to join.
                    </p>
                  </div>
                  <div className={inviteStyles.sidebarBlock}>
                    <h3 className={inviteStyles.sidebarTitle}>Role types</h3>
                    <p className={inviteStyles.sidebarText}>
                      Managers help run the business. Staff get focused access for
                      daily work. You can change roles later.
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
