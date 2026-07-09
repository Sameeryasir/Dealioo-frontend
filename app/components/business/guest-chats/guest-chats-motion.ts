import { standardEase } from "@/app/lib/motion";

export const guestChatEase = standardEase;

export const guestChatStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const guestChatCardReveal = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: guestChatEase },
  },
};

export const guestChatMessageReveal = {
  hidden: { opacity: 0, y: 16 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: guestChatEase, delay: index * 0.04 },
  }),
};

export const guestChatPanelReveal = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: guestChatEase },
  },
};

export const guestChatHoverLift = {
  rest: { y: 0, scale: 1, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)" },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: "0 12px 28px rgba(59, 130, 246, 0.12)",
    transition: { duration: 0.22, ease: guestChatEase },
  },
  selected: {
    y: 0,
    scale: 1.01,
    boxShadow: "0 8px 24px rgba(59, 130, 246, 0.14)",
    transition: { duration: 0.22, ease: guestChatEase },
  },
};
