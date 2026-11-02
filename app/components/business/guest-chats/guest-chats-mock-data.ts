import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import type { ConversationMessage } from "@/app/services/chat/get-business-conversation";

export function isMockGuestChatCustomerId(customerId: number): boolean {
  return customerId <= -1000;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number, hour = 14): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 20, 0, 0);
  return d.toISOString();
}

export const MOCK_GUEST_CHAT_CUSTOMERS: ChatCustomer[] = [
  {
    conversationId: -1001,
    customerId: -1001,
    customerName: "Ayesha Khan",
    customerEmail: "ayesha.khan@email.com",
    messageCount: 6,
    lastMessagePreview: "Thanks! Looking forward to picking up tonight.",
    lastMessageChannel: "email",
    lastMessageAt: hoursAgo(1),
    lastAutomationName: "Order confirmation",
    createdAt: daysAgo(3),
    unreadCount: 2,
  },
  {
    conversationId: -1002,
    customerId: -1002,
    customerName: "Omar Siddiqui",
    customerEmail: "omar.s@email.com",
    messageCount: 4,
    lastMessagePreview: "Can I change my order to spicy fries?",
    lastMessageChannel: "sms",
    lastMessageAt: hoursAgo(3),
    lastAutomationName: null,
    createdAt: daysAgo(5),
    unreadCount: 1,
  },
  {
    conversationId: -1003,
    customerId: -1003,
    customerName: "Fatima Noor",
    customerEmail: "fatima.noor@email.com",
    messageCount: 5,
    lastMessagePreview: "Your reward is ready to redeem.",
    lastMessageChannel: "email",
    lastMessageAt: hoursAgo(6),
    lastAutomationName: "Reward reminder",
    createdAt: daysAgo(8),
    unreadCount: 0,
  },
  {
    conversationId: -1004,
    customerId: -1004,
    customerName: "Daniel Brooks",
    customerEmail: "daniel.brooks@email.com",
    messageCount: 3,
    lastMessagePreview: "Is outdoor seating available this weekend?",
    lastMessageChannel: "whatsapp",
    lastMessageAt: hoursAgo(12),
    lastAutomationName: null,
    createdAt: daysAgo(2),
    unreadCount: 0,
  },
  {
    conversationId: -1005,
    customerId: -1005,
    customerName: "Hina Malik",
    customerEmail: "hina.malik@email.com",
    messageCount: 7,
    lastMessagePreview: "Payment received — see you soon!",
    lastMessageChannel: "email",
    lastMessageAt: daysAgo(1, 19),
    lastAutomationName: "Payment thank-you",
    createdAt: daysAgo(10),
    unreadCount: 0,
  },
  {
    conversationId: -1006,
    customerId: -1006,
    customerName: "James Carter",
    customerEmail: "j.carter@email.com",
    messageCount: 2,
    lastMessagePreview: "Hi! We saved your table for 7:30 pm.",
    lastMessageChannel: "sms",
    lastMessageAt: daysAgo(1, 11),
    lastAutomationName: "Reservation confirm",
    createdAt: daysAgo(1),
    unreadCount: 0,
  },
  {
    conversationId: -1007,
    customerId: -1007,
    customerName: "Sara Ahmed",
    customerEmail: "sara.ahmed@email.com",
    messageCount: 4,
    lastMessagePreview: "Could you share today’s specials?",
    lastMessageChannel: "whatsapp",
    lastMessageAt: daysAgo(2, 16),
    lastAutomationName: null,
    createdAt: daysAgo(4),
    unreadCount: 3,
  },
  {
    conversationId: -1008,
    customerId: -1008,
    customerName: "Leo Martins",
    customerEmail: "leo.martins@email.com",
    messageCount: 5,
    lastMessagePreview: "Great — order #4821 is on the way.",
    lastMessageChannel: "email",
    lastMessageAt: daysAgo(3, 13),
    lastAutomationName: "Delivery update",
    createdAt: daysAgo(6),
    unreadCount: 0,
  },
];

function msg(
  id: number,
  direction: ConversationMessage["direction"],
  body: string,
  sentAt: string,
  kind: ConversationMessage["kind"] = "email",
): ConversationMessage {
  return {
    id,
    kind,
    direction,
    sentBy: null,
    sentTo: null,
    body,
    stepType: null,
    sentAt,
    error: null,
  };
}

export const MOCK_GUEST_CHAT_MESSAGES: Record<number, ConversationMessage[]> = {
  [-1001]: [
    msg(-1101, "outbound", "Hi Ayesha — your Flame Burger order is confirmed!", hoursAgo(5)),
    msg(-1102, "inbound", "Awesome, what time should I come?", hoursAgo(4)),
    msg(-1103, "outbound", "Anytime after 6:30 pm works great.", hoursAgo(3)),
    msg(-1104, "inbound", "Thanks! Looking forward to picking up tonight.", hoursAgo(1)),
  ],
  [-1002]: [
    msg(-1201, "inbound", "Can I change my order to spicy fries?", hoursAgo(3), "sms"),
    msg(-1202, "outbound", "Done — we updated your order to spicy fries.", hoursAgo(2), "sms"),
  ],
  [-1003]: [
    msg(-1301, "outbound", "Your reward is ready to redeem.", hoursAgo(6)),
    msg(-1302, "inbound", "Perfect, I’ll use it this Friday.", hoursAgo(5)),
  ],
  [-1004]: [
    msg(-1401, "inbound", "Is outdoor seating available this weekend?", hoursAgo(12), "whatsapp"),
    msg(-1402, "outbound", "Yes — we still have patio tables for Saturday evening.", hoursAgo(11), "whatsapp"),
  ],
  [-1005]: [
    msg(-1501, "outbound", "Payment received — see you soon!", daysAgo(1, 19)),
  ],
  [-1006]: [
    msg(-1601, "outbound", "Hi! We saved your table for 7:30 pm.", daysAgo(1, 11), "sms"),
  ],
  [-1007]: [
    msg(-1701, "inbound", "Could you share today’s specials?", daysAgo(2, 16), "whatsapp"),
    msg(-1702, "outbound", "Today: smash burger + mango iced tea combo.", daysAgo(2, 17), "whatsapp"),
  ],
  [-1008]: [
    msg(-1801, "outbound", "Great — order #4821 is on the way.", daysAgo(3, 13)),
  ],
};

export function getMockGuestChatMessages(
  customerId: number,
): ConversationMessage[] {
  return MOCK_GUEST_CHAT_MESSAGES[customerId] ?? [];
}

export function filterMockGuestChatCustomers(search: string): ChatCustomer[] {
  const q = search.trim().toLowerCase();
  if (!q) return MOCK_GUEST_CHAT_CUSTOMERS;
  return MOCK_GUEST_CHAT_CUSTOMERS.filter((row) => {
    const name = row.customerName?.toLowerCase() ?? "";
    const email = row.customerEmail?.toLowerCase() ?? "";
    const preview = row.lastMessagePreview.toLowerCase();
    return name.includes(q) || email.includes(q) || preview.includes(q);
  });
}
