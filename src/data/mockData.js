// Smart AgroMart Comprehensive Mock Dataset

export const kpiStats = [
  {
    id: 'sales',
    title: "Today's Sales",
    value: "₹24,560",
    change: "+12%",
    isPositive: true,
    bg: "bg-emerald-50 border-emerald-200/80 text-emerald-900",
    accent: "text-emerald-600 bg-emerald-100",
    sparkline: [40, 55, 60, 45, 75, 90, 85]
  },
  {
    id: 'profit',
    title: "Profit",
    value: "₹6,320",
    change: "+18%",
    isPositive: true,
    bg: "bg-sky-50 border-sky-200/80 text-sky-900",
    accent: "text-sky-600 bg-sky-100",
    sparkline: [30, 40, 45, 60, 70, 65, 80]
  },
  {
    id: 'bills',
    title: "Bills Generated",
    value: "48",
    change: "+7%",
    isPositive: true,
    bg: "bg-amber-50 border-amber-200/80 text-amber-900",
    accent: "text-amber-600 bg-amber-100",
    sparkline: [20, 30, 25, 40, 35, 50, 48]
  },
  {
    id: 'credit',
    title: "Pending Credit",
    value: "₹12,400",
    change: "-5%",
    isPositive: true,
    bg: "bg-purple-50 border-purple-200/80 text-purple-900",
    accent: "text-purple-600 bg-purple-100",
    sparkline: [80, 75, 70, 65, 60, 55, 50]
  },
  {
    id: 'stock',
    title: "Low Stock Products",
    value: "6",
    change: "+2",
    isPositive: false,
    bg: "bg-rose-50 border-rose-200/80 text-rose-900",
    accent: "text-rose-600 bg-rose-100",
    sparkline: [2, 3, 4, 3, 5, 4, 6]
  },
  {
    id: 'farmers',
    title: "Total Farmers",
    value: "156",
    change: "+11%",
    isPositive: true,
    bg: "bg-teal-50 border-teal-200/80 text-teal-900",
    accent: "text-teal-600 bg-teal-100",
    sparkline: [100, 115, 125, 135, 142, 150, 156]
  }
];

export const salesTrendData = [
  { day: 'Mon', sales: 20000 },
  { day: 'Tue', sales: 30000 },
  { day: 'Wed', sales: 43000 },
  { day: 'Thu', sales: 32000 },
  { day: 'Fri', sales: 31000 },
  { day: 'Sat', sales: 50000 },
  { day: 'Sun', sales: 48000 },
  { day: 'Today', sales: 72000 },
];

export const topSellingProducts = [
  { rank: 1, name: "DAP Fertilizer (50kg)", units: 320, category: "Fertilizers", price: "₹1,350" },
  { rank: 2, name: "Urea Fertilizer (45kg)", units: 280, category: "Fertilizers", price: "₹266" },
  { rank: 3, name: "NPK 19:19:19 (1kg)", units: 210, category: "Fertilizers", price: "₹180" },
  { rank: 4, name: "Glyphosate 41% SL (1L)", units: 150, category: "Pesticides", price: "₹450" },
  { rank: 5, name: "Organic Bio-Manure (25kg)", units: 120, category: "Fertilizers", price: "₹600" },
];

export const inventoryStatusData = [
  { name: 'In Stock', value: 248, color: '#22C55E' },
  { name: 'Low Stock', value: 36, color: '#F59E0B' },
  { name: 'Out of Stock', value: 12, color: '#EF4444' },
  { name: 'Expiring Soon', value: 24, color: '#F97316' },
];

export const aiForecastData = [
  { month: 'May', sales: 42000, forecast: 42000 },
  { month: 'Jun', sales: 48000, forecast: 48000 },
  { month: 'Jul', sales: 51000, forecast: 51000 },
  { month: 'Aug', sales: 55000, forecast: 55000 },
  { month: 'Sep', forecast: 62000 },
  { month: 'Oct', forecast: 71000 },
];

export const smartAlerts = [
  {
    id: 1,
    title: "Urea stock is below 10 units",
    time: "2 hours ago",
    type: "danger",
    actionText: "Take Action"
  },
  {
    id: 2,
    title: "3 farmers have pending payments overdue",
    time: "4 hours ago",
    type: "warning",
    actionText: "View Details"
  },
  {
    id: 3,
    title: "High demand predicted for DAP next month",
    time: "5 hours ago",
    type: "success",
    actionText: "Plan Stock"
  },
  {
    id: 4,
    title: "2 fungicide products expiring within 30 days",
    time: "1 day ago",
    type: "info",
    actionText: "Check Now"
  }
];

export const initialProducts = [
  { id: 'P101', name: 'DAP Fertilizer 50kg', category: 'Fertilizers', brand: 'IFFCO', gst: 5, purchasePrice: 1200, sellingPrice: 1350, stock: 35, unit: 'Bags', batch: 'BT2026A', expiry: '2027-08-15', status: 'Low Stock' },
  { id: 'P102', name: 'Urea Fertilizer 45kg', category: 'Fertilizers', brand: 'KRIBHCO', gst: 5, purchasePrice: 242, sellingPrice: 266, stock: 8, unit: 'Bags', batch: 'BT2026B', expiry: '2028-01-10', status: 'Low Stock' },
  { id: 'P103', name: 'NPK 19:19:19 1kg', category: 'Fertilizers', brand: 'Mahadhan', gst: 12, purchasePrice: 140, sellingPrice: 180, stock: 145, unit: 'Packets', batch: 'BT2025C', expiry: '2026-11-20', status: 'In Stock' },
  { id: 'P104', name: 'Glyphosate 41% SL 1L', category: 'Pesticides', brand: 'Syngenta', gst: 18, purchasePrice: 380, sellingPrice: 450, stock: 42, unit: 'Bottles', batch: 'BT2025D', expiry: '2026-10-05', status: 'In Stock' },
  { id: 'P105', name: 'Soybean Seeds JS-335 30kg', category: 'Seeds', brand: 'Mahyco', gst: 0, purchasePrice: 2800, sellingPrice: 3200, stock: 0, unit: 'Bags', batch: 'BT2026E', expiry: '2027-04-12', status: 'Out of Stock' },
  { id: 'P106', name: 'Copper Oxychloride Fungicide 500g', category: 'Fungicides', brand: 'Bayer', gst: 18, purchasePrice: 290, sellingPrice: 350, stock: 15, unit: 'Packets', batch: 'BT2024F', expiry: '2026-09-28', status: 'Expiring Soon' },
  { id: 'P107', name: 'Knapsack Battery Sprayer 16L', category: 'Tools', brand: 'Aspee', gst: 18, purchasePrice: 2200, sellingPrice: 2750, stock: 12, unit: 'Units', batch: 'BT2025G', expiry: 'N/A', status: 'In Stock' },
];

export const initialFarmers = [
  { id: 'F001', name: 'Ramesh Patil', mobile: '+91 98230 11223', village: 'Shirol', crop: 'Sugarcane & Wheat', totalPurchases: '₹48,500', pendingCredit: 3400, lastPurchase: '2026-09-02' },
  { id: 'F002', name: 'Suresh Deshmukh', mobile: '+91 94221 44556', village: 'Akole', crop: 'Soybean & Cotton', totalPurchases: '₹32,200', pendingCredit: 1850, lastPurchase: '2026-09-06' },
  { id: 'F003', name: 'Vikram Shinde', mobile: '+91 98901 22334', village: 'Sangamner', crop: 'Onion & Pomegranate', totalPurchases: '₹65,000', pendingCredit: 0, lastPurchase: '2026-08-28' },
  { id: 'F004', name: 'Ananda Jadhav', mobile: '+91 97632 88990', village: 'Rahuri', crop: 'Maize & Bajra', totalPurchases: '₹21,800', pendingCredit: 5200, lastPurchase: '2026-09-01' },
  { id: 'F005', name: 'Balasaheb Pawar', mobile: '+91 91580 77665', village: 'Kopargaon', crop: 'Grapes & Sugarcane', totalPurchases: '₹94,100', pendingCredit: 1950, lastPurchase: '2026-09-07' },
];

export const initialKhataLedger = [
  { id: 'K1', farmer: 'Ramesh Patil', mobile: '+91 98230 11223', totalCredit: 8400, paid: 5000, pending: 3400, dueDate: '2026-09-20', status: 'Overdue' },
  { id: 'K2', farmer: 'Suresh Deshmukh', mobile: '+91 94221 44556', totalCredit: 3850, paid: 2000, pending: 1850, dueDate: '2026-09-25', status: 'Active' },
  { id: 'K3', farmer: 'Ananda Jadhav', mobile: '+91 97632 88990', totalCredit: 7200, paid: 2000, pending: 5200, dueDate: '2026-09-15', status: 'Due Soon' },
  { id: 'K4', farmer: 'Balasaheb Pawar', mobile: '+91 91580 77665', totalCredit: 11950, paid: 10000, pending: 1950, dueDate: '2026-10-01', status: 'Active' },
];
