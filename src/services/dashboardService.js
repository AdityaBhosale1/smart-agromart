// Smart AgroMart Centralized Live Dashboard Analytics Service
import { supabase } from '../lib/supabase';

export async function getDashboardMetrics() {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    // 1. Fetch Today's Bills
    const { data: todayBills, error: billsErr } = await supabase
      .from('bills')
      .select('*')
      .gte('created_at', startOfToday);
    
    if (billsErr) throw billsErr;

    const todaysSales = (todayBills || []).reduce((sum, b) => sum + (Number(b.grand_total) || 0), 0);
    const billsGenerated = (todayBills || []).length;

    // 2. Calculate Today's Profit (Revenue - COGS)
    let todaysProfit = 0;
    if (todayBills && todayBills.length > 0) {
      const billIds = todayBills.map(b => b.id);
      const { data: billItems, error: itemsErr } = await supabase
        .from('bill_items')
        .select(`
          *,
          products ( purchase_price ),
          product_batches ( purchase_price )
        `)
        .in('bill_id', billIds);
      
      if (!itemsErr && billItems) {
        let totalCOGS = 0;
        let totalRevenue = 0;
        billItems.forEach(item => {
          const qty = Number(item.quantity) || 0;
          const unitPrice = Number(item.unit_price) || 0;
          const batchCost = item.product_batches ? Number(item.product_batches.purchase_price) : null;
          const prodCost = item.products ? Number(item.products.purchase_price) : 0;
          const cost = batchCost !== null && batchCost !== undefined ? batchCost : prodCost;
          
          totalCOGS += qty * cost;
          totalRevenue += qty * unitPrice;
        });
        todaysProfit = Math.max(0, totalRevenue - totalCOGS);
      }
    }

    // 3. Fetch Farmers for Pending Credit & Total Farmers
    const { data: farmers, error: fErr } = await supabase
      .from('farmers')
      .select('pending_credit, status');

    if (fErr) throw fErr;

    // Reconcile 1:1 with Credit Management
    const pendingCredit = (farmers || []).reduce((sum, f) => sum + (Number(f.pending_credit) || 0), 0);
    const totalFarmers = (farmers || []).length;

    // 4. Fetch Products for Low Stock & Inventory Status
    const { data: products, error: pErr } = await supabase
      .from('products')
      .select('total_stock, min_stock_alert');

    if (pErr) throw pErr;

    const lowStockCount = (products || []).filter(p => (p.total_stock || 0) <= (p.min_stock_alert || 10)).length;

    let inStock = 0, lowStock = 0, outOfStock = 0;
    (products || []).forEach(p => {
      const stock = p.total_stock || 0;
      const minAlert = p.min_stock_alert || 10;
      if (stock === 0) outOfStock++;
      else if (stock <= minAlert) lowStock++;
      else inStock++;
    });

    const inventoryStatusData = [
      { name: 'In Stock', value: inStock, color: '#22C55E' },
      { name: 'Low Stock', value: lowStock, color: '#F59E0B' },
      { name: 'Out of Stock', value: outOfStock, color: '#EF4444' },
      { name: 'Expiring Soon', value: 0, color: '#F97316' }
    ];

    // 5. 7-Day Sales Trend Data
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      past7Days.push({ dateStr, day: i === 0 ? 'Today' : dayName, sales: 0 });
    }

    const sevenDaysAgo = past7Days[0].dateStr + 'T00:00:00.000Z';
    const { data: weekBills } = await supabase
      .from('bills')
      .select('grand_total, created_at')
      .gte('created_at', sevenDaysAgo);

    if (weekBills) {
      weekBills.forEach(b => {
        if (b.created_at) {
          const bDateStr = b.created_at.split('T')[0];
          const found = past7Days.find(p => p.dateStr === bDateStr);
          if (found) {
            found.sales += Number(b.grand_total) || 0;
          }
        }
      });
    }

    const salesTrendData = past7Days.map(p => ({ day: p.day, sales: p.sales }));

    // 6. Top Selling Products
    const { data: allBillItems } = await supabase
      .from('bill_items')
      .select('product_name, quantity');

    const productMap = {};
    if (allBillItems) {
      allBillItems.forEach(item => {
        const name = item.product_name || 'Unknown Product';
        const qty = Number(item.quantity) || 0;
        productMap[name] = (productMap[name] || 0) + qty;
      });
    }

    const sortedProducts = Object.keys(productMap)
      .map(name => ({ name, units: productMap[name] }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const topSellingProducts = sortedProducts.length > 0 
      ? sortedProducts.map((item, idx) => ({ rank: idx + 1, name: item.name, units: item.units }))
      : [
          { rank: 1, name: "No Sales Recorded", units: 0 }
        ];

    // Format KPI Stats object for UI matching existing kpiStats array structure
    const kpiStats = [
      {
        id: 'sales',
        title: "Today's Sales",
        value: `₹${todaysSales.toLocaleString('en-IN')}`,
        change: "+12%",
        isPositive: true,
        bg: "bg-emerald-50 border-emerald-200/80 text-emerald-900",
        accent: "text-emerald-600 bg-emerald-100",
        sparkline: [40, 55, 60, 45, 75, 90, Math.min(100, Math.max(10, todaysSales / 100))]
      },
      {
        id: 'profit',
        title: "Profit",
        value: `₹${todaysProfit.toLocaleString('en-IN')}`,
        change: "+18%",
        isPositive: true,
        bg: "bg-sky-50 border-sky-200/80 text-sky-900",
        accent: "text-sky-600 bg-sky-100",
        sparkline: [30, 40, 45, 60, 70, 65, Math.min(100, Math.max(10, todaysProfit / 50))]
      },
      {
        id: 'bills',
        title: "Bills Generated",
        value: `${billsGenerated}`,
        change: "+7%",
        isPositive: true,
        bg: "bg-amber-50 border-amber-200/80 text-amber-900",
        accent: "text-amber-600 bg-amber-100",
        sparkline: [20, 30, 25, 40, 35, 50, Math.min(100, Math.max(10, billsGenerated * 10))]
      },
      {
        id: 'credit',
        title: "Pending Credit",
        value: `₹${pendingCredit.toLocaleString('en-IN')}`,
        change: "-5%",
        isPositive: true,
        bg: "bg-purple-50 border-purple-200/80 text-purple-900",
        accent: "text-purple-600 bg-purple-100",
        sparkline: [80, 75, 70, 65, 60, 55, Math.min(100, Math.max(10, pendingCredit / 500))]
      },
      {
        id: 'stock',
        title: "Low Stock Products",
        value: `${lowStockCount}`,
        change: lowStockCount > 0 ? `+${lowStockCount}` : '0',
        isPositive: lowStockCount === 0,
        bg: "bg-rose-50 border-rose-200/80 text-rose-900",
        accent: "text-rose-600 bg-rose-100",
        sparkline: [2, 3, 4, 3, 5, 4, Math.min(100, Math.max(5, lowStockCount * 15))]
      },
      {
        id: 'farmers',
        title: "Total Farmers",
        value: `${totalFarmers}`,
        change: "+11%",
        isPositive: true,
        bg: "bg-teal-50 border-teal-200/80 text-teal-900",
        accent: "text-teal-600 bg-teal-100",
        sparkline: [100, 115, 125, 135, 142, 150, Math.min(100, Math.max(10, totalFarmers))]
      }
    ];

    return {
      kpiStats,
      salesTrendData,
      topSellingProducts,
      inventoryStatusData,
      todaysSales,
      todaysProfit,
      pendingCredit,
      totalFarmers,
      lowStockCount,
      billsGenerated
    };
  } catch (err) {
    console.error('Error fetching dashboard metrics from Supabase:', err);
    return null;
  }
}
