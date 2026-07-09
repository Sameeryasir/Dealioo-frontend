export type FunnelLandingCopy = {
  heading: string;
  subheading: string;
  body: string;
  buttonText: string;
};

export type FunnelLandingCopyTemplate = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  copy: FunnelLandingCopy;
};

export const FUNNEL_COPY_TEMPLATE_TAGS = [
  "All",
  "Business",
  "E‑commerce",
  "Wellness",
  "Events",
  "Membership",
  "Abandoned cart",
] as const;

export type FunnelCopyTemplateTag = (typeof FUNNEL_COPY_TEMPLATE_TAGS)[number];

export const FUNNEL_LANDING_COPY_TEMPLATES: FunnelLandingCopyTemplate[] = [
  {
    id: "copy-restaurant-booking",
    name: "Table booking",
    description: "Reserve a table, warm and direct.",
    tags: ["Business"],
    copy: {
      heading: "Your table is almost reserved",
      subheading: "Join guests who book online in under a minute.",
      body: "See tonight's specials, pick your time, and we'll hold your table. No phone tag, just confirm and arrive.",
      buttonText: "Reserve my table",
    },
  },
  {
    id: "copy-restaurant-offer",
    name: "Chef's special",
    description: "Promote a limited dining offer.",
    tags: ["Business"],
    copy: {
      heading: "Tonight's chef special is waiting",
      subheading: "A limited offer for guests who sign up today.",
      body: "Fresh ingredients, seasonal menu, and a price that won't last the weekend. Claim your spot before we're fully booked.",
      buttonText: "Book now",
    },
  },
  {
    id: "copy-family-deal",
    name: "Family deal",
    description: "Friendly promo for families.",
    tags: ["Business", "Events"],
    copy: {
      heading: "Family night, kids eat free",
      subheading: "Bring everyone this week only.",
      body: "Valid for dine-in when you join our list. One free kids meal per adult entrée. Limited tables each night.",
      buttonText: "Claim the deal",
    },
  },
  {
    id: "copy-abandoned-checkout",
    name: "Abandoned checkout",
    description: "Bring back guests who didn't finish paying.",
    tags: ["Abandoned cart", "E‑commerce"],
    copy: {
      heading: "Complete your order, offer inside",
      subheading: "You left something behind. We saved your spot.",
      body: "Finish checkout in one click and unlock the same price you saw earlier. This reminder expires in 48 hours.",
      buttonText: "Complete my order",
    },
  },
  {
    id: "copy-limited-drop",
    name: "Limited drop",
    description: "Urgency for retail or flash sales.",
    tags: ["E‑commerce", "Events"],
    copy: {
      heading: "Limited drop, live now",
      subheading: "When it's gone, it's gone.",
      body: "Join the list for early access and checkout before the public sale opens. No code needed, your link is already applied.",
      buttonText: "Shop the drop",
    },
  },
  {
    id: "copy-free-trial",
    name: "Free trial",
    description: "SaaS or subscription trial signup.",
    tags: ["E‑commerce"],
    copy: {
      heading: "Start your free trial",
      subheading: "No credit card required to begin.",
      body: "Set up in minutes, cancel anytime, and upgrade only when you're ready. Full access to every feature during your trial.",
      buttonText: "Start free trial",
    },
  },
  {
    id: "copy-wellness-class",
    name: "Wellness class",
    description: "Yoga, fitness, or calm brands.",
    tags: ["Wellness"],
    copy: {
      heading: "Find your calm this week",
      subheading: "New guests get their first class on us.",
      body: "Small groups, experienced instructors, and a space built to help you reset. Sign up once, we'll send your schedule.",
      buttonText: "Book a class",
    },
  },
  {
    id: "copy-wellness-journey",
    name: "Wellness journey",
    description: "Longer-form trust-building copy.",
    tags: ["Wellness"],
    copy: {
      heading: "Start your wellness journey",
      subheading: "Simple habits. Real results.",
      body: "Whether you're returning or starting fresh, our program meets you where you are. Nutrition tips, guided sessions, and community support included.",
      buttonText: "Join free",
    },
  },
  {
    id: "copy-event-tickets",
    name: "Event tickets",
    description: "Concerts, nightlife, live events.",
    tags: ["Events"],
    copy: {
      heading: "Tickets on sale now",
      subheading: "Secure your spot before doors open.",
      body: "Mobile tickets delivered instantly. Limited capacity, purchase now and skip the line at entry.",
      buttonText: "Get tickets",
    },
  },
  {
    id: "copy-vip-invite",
    name: "VIP invitation",
    description: "Exclusive or luxury offers.",
    tags: ["Events", "Membership"],
    copy: {
      heading: "An invitation reserved for you",
      subheading: "Private access, limited availability.",
      body: "You're on our short list for early pricing and priority access. Confirm below to hold your place.",
      buttonText: "Accept invitation",
    },
  },
  {
    id: "copy-membership-club",
    name: "Members club",
    description: "Recurring membership or wine club.",
    tags: ["Membership", "Business"],
    copy: {
      heading: "Join the members club",
      subheading: "Exclusive perks every month.",
      body: "Priority booking, member-only pricing, and surprises curated for regulars. Cancel anytime from your account.",
      buttonText: "Become a member",
    },
  },
  {
    id: "copy-wine-cellar",
    name: "Wine cellar club",
    description: "Fine dining or wine subscription.",
    tags: ["Membership", "Business"],
    copy: {
      heading: "Join the cellar club",
      subheading: "Sommelier picks delivered to your door.",
      body: "Two bottles monthly, tasting notes, and member savings on every dine-in visit. First shipment ships when you join.",
      buttonText: "Join the club",
    },
  },
  {
    id: "copy-resort-stay",
    name: "Resort getaway",
    description: "Travel, beach, or hospitality.",
    tags: ["Business", "Events"],
    copy: {
      heading: "Your beach getaway starts here",
      subheading: "Best rate when you book direct.",
      body: "Ocean views, flexible dates, and complimentary breakfast for direct bookings. Check live availability and reserve in minutes.",
      buttonText: "Check availability",
    },
  },
  {
    id: "copy-bakery-treat",
    name: "Bakery treat",
    description: "Bakeries and sweet promos.",
    tags: ["Business"],
    copy: {
      heading: "Free treat on your first order",
      subheading: "Baked fresh daily, limited batches.",
      body: "Sign up once and we'll send a code for a free pastry or scoop on your first pickup or delivery order.",
      buttonText: "Order now",
    },
  },
  {
    id: "copy-minimal-cta",
    name: "Short & minimal",
    description: "Few words, strong CTA.",
    tags: ["E‑commerce"],
    copy: {
      heading: "Simple. Clear. Yours.",
      subheading: "Everything you need on one page.",
      body: "No fluff, just your offer and a fast way to sign up.",
      buttonText: "Continue",
    },
  },
  {
    id: "copy-trust-social",
    name: "Trust & proof",
    description: "Social proof and credibility.",
    tags: ["E‑commerce", "Abandoned cart"],
    copy: {
      heading: "Trusted by thousands of customers",
      subheading: "Join them in under 60 seconds.",
      body: "Secure checkout, clear pricing, and support that replies within one business day. See why guests come back.",
      buttonText: "See my offer",
    },
  },
];

export function funnelCopyTemplatesForTag(
  tag: FunnelCopyTemplateTag,
): FunnelLandingCopyTemplate[] {
  if (tag === "All") return FUNNEL_LANDING_COPY_TEMPLATES;
  return FUNNEL_LANDING_COPY_TEMPLATES.filter((t) => t.tags.includes(tag));
}
