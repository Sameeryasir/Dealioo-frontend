# Signup Automation — Full Flow (37 Steps)

**Template ID:** `signup_automation`  
**Purpose:** `funnel_signup`  
**Source:** `app/components/automation/automation-templates.ts`

---

## Tree overview

```
1. Trigger — Signed up for campaign
        │
2–4. Initial Actions (Pass Link SMS → Welcome SMS → Give Reward)
        │
5. Parallel Split ──────────────────────────────────────────┐
        │                                                   │
        ▼                                                   ▼
┌─────────────────────┐                     ┌───────────────────────────┐
│ A. Wallet Reminder  │                     │ B. Follow-up Message      │
│ 6–8 (3 steps)       │                     │ 9–11                      │
└─────────────────────┘                     │         │                 │
                                            │ 12. Nested Parallel Split │
                                            └─────────┬─────────────────┘
                          ┌───────────────────────────┴───────────────────────────┐
                          ▼                                                       ▼
        ┌─────────────────────────────────────┐               ┌─────────────────────────────┐
        │ Left: Offer Expiry chain            │               │ Right: Add Pass (Weekend)   │
        │ 13–27 (sections + Offer expired)    │               │ 35–37 (3 steps)             │
        │         │                           │               └─────────────────────────────┘
        │ 28. Parallel Split                  │
        └─────────┬───────────────────────────┘
                  ├──────────────────┐
                  ▼                  ▼
     ┌────────────────────┐   ┌──────────────────────────┐
     │ Extend offer       │   │ Why didn't you come by?  │
     │ 29–31              │   │ 32–34                    │
     └────────────────────┘   └──────────────────────────┘
```

---

## Step list (1–37)

### Trunk — Trigger + Initial Actions

| # | Key | Type | Summary |
|---|-----|------|---------|
| 1 | `trigger` | Signup trigger | Signed up for campaign |
| 2 | `sms_pass_link` | Send Text | Complete signup — add pass: `[Pass Link]` |
| 3 | `sms_welcome` | Send Text | Welcome SMS (`[First Name]`) |
| 4 | `give_reward` | Give Rewards | Campaign offer — expires 14 days after signup |
| 5 | `parallel_split` | Parallel Split | Wallet Reminder \| Follow-up Message |

---

### Branch A — Wallet Reminder

| # | Key | Type | Summary |
|---|-----|------|---------|
| 6 | `wait_wallet` | Wait until | 15 minutes elapsed |
| 7 | `filter_wallet` | Filters | NOT Pass was added |
| 8 | `sms_wallet_reminder` | Send Text | Digital wallet reminder + `[Pass Link]` |

---

### Branch B — Follow-up Message

| # | Key | Type | Summary |
|---|-----|------|---------|
| 9 | `wait_follow_up` | Wait until | Next day at 10:34 AM |
| 10 | `filter_follow_up` | Filters | Over 7 hours since signup **AND** NOT Reward was redeemed |
| 11 | `sms_follow_up` | Send Text | Union hours / maps / menu follow-up |
| 12 | `parallel_split_follow_up` | Parallel Split | Offer Expires End of Week \| Add Pass (Weekend) |

---

### Branch B → Left — Reminder: Offer Expires End of Week

| # | Key | Type | Summary |
|---|-----|------|---------|
| 13 | `wait_offer_expiry` | Wait until | 8:18 AM |
| 14 | `filter_offer_expiry` | Filters | Offer expires in less than 6 days |
| 15 | `sms_offer_expiry` | Send Text | Friendly reminder — expires this Sunday |

---

### Branch B → Left — Reminder: Offer Expires in 3 Days

| # | Key | Type | Summary |
|---|-----|------|---------|
| 16 | `wait_offer_expiry_3d` | Wait until | 11:12 AM |
| 17 | `filter_offer_expiry_3d` | Filters | Offer expires in less than 3 days |
| 18 | `sms_offer_expiry_3d` | Send Text | Quick reminder — less than 3 days left |

---

### Branch B → Left — Reminder: Offer Expires Tomorrow

| # | Key | Type | Summary |
|---|-----|------|---------|
| 19 | `wait_offer_expiry_tomorrow` | Wait until | Saturday at 10:36 AM |
| 20 | `filter_offer_expiry_tomorrow` | Filters | Less than a day until $4 Pretzel Bites will expire |
| 21 | `sms_offer_expiry_tomorrow` | Send Text | No pressure — expires tomorrow night |

---

### Branch B → Left — Reminder: Offer Expires Today

| # | Key | Type | Summary |
|---|-----|------|---------|
| 22 | `wait_offer_expiry_today` | Wait until | 11:07 am |
| 23 | `filter_offer_expiry_today` | Filters | $4 Pretzel Bites expired today |
| 24 | `sms_offer_expiry_today` | Send Text | Last reminder — expires tonight + Pass Link + location |

---

### Branch B → Left — Offer expired

| # | Key | Type | Summary |
|---|-----|------|---------|
| 25 | `wait_offer_expired` | Wait until | Monday at 11:01 am |
| 26 | `filter_offer_expired` | Filters | $4 Pretzel Bites expired |
| 27 | `sms_offer_expired` | Send Text | Offer expired — text EXTEND for 2 more weeks |
| 28 | `parallel_split_after_expired` | Parallel Split | Extend offer expiration \| Why didn't you come by? |

---

### After Offer expired → Left — Extend offer expiration

| # | Key | Type | Summary |
|---|-----|------|---------|
| 29 | `wait_extend_offer` | Wait until | No delay |
| 30 | `sms_extend_offer` | Send Text | Offer pushed back 2 weeks confirmation |
| 31 | `extend_reward_expiration` | Extend Reward Expiration | Extend offer: $4 Pretzel Bites by 2 weeks |

---

### After Offer expired → Right — Why didn't you come by?

| # | Key | Type | Summary |
|---|-----|------|---------|
| 32 | `wait_why_didnt_come` | Wait until | 9:21 am |
| 33 | `filter_why_didnt_come` | Filters | Over 3 days since $4 Pretzel Bites expired |
| 34 | `sms_why_didnt_come` | Send Text | Feedback ask — Team Union |

---

### Branch B → Right — Reminder: Add Pass (Weekend)

| # | Key | Type | Summary |
|---|-----|------|---------|
| 35 | `wait_weekend_pass` | Wait until | Friday 8:58 AM |
| 36 | `filter_weekend_pass` | Filters | NOT Pass was added **AND** Over a day since signup **AND** Less than a week since signup **AND** NOT $4 Pretzel Bites was redeemed |
| 37 | `sms_weekend_pass` | Send Text | Weekend wallet reminder + `[Pass Link]` |

---

## Parallel splits (3)

| Split key | Parent branch | Child branches |
|-----------|---------------|----------------|
| `parallel_split` | *(trunk)* | Wallet Reminder · Follow-up Message |
| `parallel_split_follow_up` | Follow-up Message | Offer Expires End of Week · Add Pass (Weekend) |
| `parallel_split_after_expired` | Offer Expiry path | Extend offer expiration · Why didn't you come by? |

---

## Connection map (high level)

```
trigger → sms_pass_link → sms_welcome → give_reward → parallel_split
                                                      ├→ wait_wallet → filter_wallet → sms_wallet_reminder
                                                      └→ wait_follow_up → filter_follow_up → sms_follow_up
                                                           → parallel_split_follow_up
                                                              ├→ [Offer Expiry chain 13–27]
                                                              │     → parallel_split_after_expired
                                                              │        ├→ wait_extend_offer → sms_extend_offer → extend_reward_expiration
                                                              │        └→ wait_why_didnt_come → filter_why_didnt_come → sms_why_didnt_come
                                                              └→ wait_weekend_pass → filter_weekend_pass → sms_weekend_pass
```

---

## Count check

| Group | Steps |
|-------|------:|
| Trunk (trigger + initial + top split) | 5 |
| Wallet Reminder | 3 |
| Follow-up Message (before nested split) | 3 |
| Nested split (follow-up) | 1 |
| Offer Expiry sections (5 × Wait/Filter/SMS) | 15 |
| Split after expired | 1 |
| Extend offer expiration | 3 |
| Why didn't you come by? | 3 |
| Add Pass (Weekend) | 3 |
| **Total** | **37** |
