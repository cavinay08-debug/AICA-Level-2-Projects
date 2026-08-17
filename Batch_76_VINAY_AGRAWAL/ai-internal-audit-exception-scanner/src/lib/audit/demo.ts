import type { Transaction } from "./types";

/** Sample ledger used by "Load Demo Data". Fictional data, safe to cache offline. */
export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "V-1001", date: "2026-04-06", vendor: "Sharma Stationers", description: "Office supplies", amount: 12500, approvedBy: "R. Mehta", account: "Printing & Stationery" },
  { id: "V-1002", date: "2026-04-06", vendor: "Sharma Stationers", description: "Office supplies", amount: 12500, approvedBy: "R. Mehta", account: "Printing & Stationery" },
  { id: "V-1003", date: "2026-04-08", vendor: "Nova Infra Pvt Ltd", description: "Civil works advance", amount: 500000, approvedBy: "", account: "Capital WIP" },
  { id: "V-1004", date: "2026-04-11", vendor: "Cloudline Systems", description: "Annual SaaS renewal", amount: 240000, approvedBy: "S. Iyer", account: "IT Expenses" },
  { id: "V-1005", date: "2026-04-12", vendor: "Kumar Travels", description: "Client visit reimbursement", amount: 18740, approvedBy: "A. Bose", account: "Travelling Expenses" },
  { id: "V-1006", date: "2026-04-12", vendor: "Kumar Travels", description: "Airport transfers", amount: 6200, approvedBy: "A. Bose", account: "Travelling Expenses" },
  { id: "V-1007", date: "2026-04-13", vendor: "Kumar Travels", description: "Hotel booking", amount: 30000, approvedBy: "", account: "Travelling Expenses" },
  { id: "V-1008", date: "2026-04-18", vendor: "Sunrise Consultancy", description: "Advisory retainer", amount: 150000, approvedBy: "R. Mehta", account: "Professional Fees" },
  { id: "V-1009", date: "2026-04-19", vendor: "Sunrise Consultancy", description: "Advisory retainer", amount: 150000, approvedBy: "R. Mehta", account: "Professional Fees" },
  { id: "V-1010", date: "2026-04-20", vendor: "Metro Electricals", description: "Wiring maintenance", amount: 47320, approvedBy: "P. Rao", account: "Repairs & Maintenance" },
  { id: "V-1011", date: "2026-04-25", vendor: "Global Logistics", description: "Freight outward", amount: 89999, approvedBy: "P. Rao", account: "Freight" },
  { id: "V-1012", date: "2026-04-26", vendor: "Nova Infra Pvt Ltd", description: "Site levelling", amount: 320000, approvedBy: "S. Iyer", account: "Capital WIP" },
  { id: "V-1013", date: "2026-04-28", vendor: "Nova Infra Pvt Ltd", description: "Mobilisation advance", amount: 200000, approvedBy: "S. Iyer", account: "Capital WIP" },
  { id: "V-1014", date: "2026-05-02", vendor: "Prime Security Services", description: "Guard services April", amount: 74500, approvedBy: "A. Bose", account: "Security Charges" },
  { id: "V-1015", date: "2026-05-03", vendor: "Anon Trading Co", description: "Misc purchase", amount: 100000, approvedBy: "", account: "Unclassified" },
  { id: "V-1016", date: "2026-05-06", vendor: "Cloudline Systems", description: "Support add-on", amount: 35400, approvedBy: "S. Iyer", account: "IT Expenses" },
  { id: "V-1017", date: "2026-05-09", vendor: "Metro Electricals", description: "Panel replacement", amount: 128000, approvedBy: "P. Rao", account: "Repairs & Maintenance" },
  { id: "V-1018", date: "2026-05-10", vendor: "Shreeji Caterers", description: "Staff refreshments", amount: 22150, approvedBy: "A. Bose", account: "Staff Welfare" },
];
