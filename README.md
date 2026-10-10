# SubTrack – Personal Subscription & Renewal Tracker

A modern, responsive web application designed to help individuals track recurring subscriptions, predict cash flow, manage renewal deadlines, and eliminate unwanted charges.

## 🚀 Key Features

1. **Executive Dashboard**:
   - Active subscription count and total monthly commitments
   - Standardized monthly equivalent spending and annual estimates
   - Upcoming renewals due in the next 7 days and overdue alerts
   - Interactive Recharts monthly projection and category donut breakdown
   - Quick one-click action buttons to Renew or Skip cycles

2. **Full Subscription Lifecycle Management**:
   - Create, edit, inspect, and delete recurring commitments
   - Autofill presets for Netflix, Spotify, YouTube Premium, GitHub Copilot, Coursera, ChatGPT Plus, and more
   - Flexible billing cycles: Weekly, Monthly, Quarterly, and Yearly
   - Currency selection with default INR (₹) as well as USD, EUR, GBP, CAD, AUD, JPY
   - Duplicate prevention system that detects matching service names, cycles, and renewal dates before saving

3. **Renewal Tracking & Urgency Tiers**:
   - Automatic renewal advancement (`weekly` +7d, `monthly` +1mo, `quarterly` +3mo, `yearly` +1yr)
   - Categorized urgency buckets:
     - 🚨 Overdue
     - ⚡ Due Today
     - ⏳ Due within 3 Days
     - 📅 Due within 7 Days
     - 🗓️ Due Later (30+ Days)
   - Cash requirements summary for the next 7, 14, and 30 days

4. **Spending Calculator & Formulas**:
   - `Weekly × 52 ÷ 12` = monthly equivalent
   - `Monthly × 12` = yearly estimate
   - `Quarterly × 4` = yearly estimate (`Quarterly ÷ 3` = monthly equivalent)
   - `Yearly ÷ 12` = monthly equivalent
   - Calculation of potential annual savings from cancelled services

5. **Smart Insights & SubTrack Optimizer**:
   - Most expensive subscription and top spending category
   - Top 5 costliest services comparison
   - Audit suggestions flagging rarely used subscriptions to reduce churn

6. **Renewal Audit History**:
   - Complete audit trail of past Renewals, Cancellations, and Skipped cycles
   - Date range and action filtering
   - Export history to CSV spreadsheet

7. **Zero-Friction Offline Demo & Persistence**:
   - Stored in browser `localStorage` out-of-the-box (no mandatory API keys or login required)
   - One-click demo data reset & restore
   - Full JSON backup export and import
   - Architecture prepared for Firebase Firestore integration

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript (Vite)
- **Styling**: Tailwind CSS v4 (Dark navy & purple accent palette)
- **Icons**: Lucide React
- **Visualizations**: Recharts
- **Celebration Effects**: Canvas Confetti

## 🏃‍♂️ Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit the application at `http://localhost:3000`.
