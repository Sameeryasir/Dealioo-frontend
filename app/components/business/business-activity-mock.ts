import type {
  ActivityMonthlyPoint,
  ActivityMonthlyResponse,
} from "@/app/services/activity/get-business-activity";

function lastMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    keys.push(`${d.getFullYear()}-${month}`);
  }
  return keys;
}

const VISITED = [14, 18, 22, 19, 26, 31];
const REDEEMED = [6, 9, 11, 10, 13, 16];
const PREPAID = [4, 6, 8, 7, 9, 11];
const MESSAGES = [8, 10, 12, 11, 14, 17];
const REVENUE_CENTS = [42000, 68000, 89000, 76000, 112000, 138000];
const ORDERS = [5, 8, 10, 9, 12, 14];
const MEMBERS = [12, 16, 18, 15, 21, 24];

export function buildBusinessActivityMock(months = 6): ActivityMonthlyResponse {
  const data: ActivityMonthlyPoint[] = lastMonthKeys(months).map((month, index) => {
    const visited = VISITED[index] ?? 0;
    const redeemedReward = REDEEMED[index] ?? 0;
    const prepaidForOffer = PREPAID[index] ?? 0;
    const messageSent = MESSAGES[index] ?? 0;

    return {
      month,
      totalEvents: visited + redeemedReward + prepaidForOffer + messageSent,
      checkIns: visited + redeemedReward,
      visited,
      redeemedReward,
      prepaidForOffer,
      messageSent,
      prepaidRevenueCents: REVENUE_CENTS[index] ?? 0,
      orders: ORDERS[index] ?? 0,
      members: MEMBERS[index] ?? 0,
    };
  });

  return {
    businessId: 0,
    months,
    activeCampaigns: 2,
    totalOrders: ORDERS.reduce((sum, value) => sum + value, 0),
    totalMembers: 124,
    todayRevenueCents: 18000,
    data,
  };
}
