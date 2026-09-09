// Smart AgroMart Centralized Digital Khata & Credit Service
// Single source of truth for farmer credit accounts, ledger entries, aging analysis & payment receipts
import { supabase } from '../lib/supabase';
import { initialMasterFarmers } from './farmerService';

export const initialMasterCreditAccounts = [
  {
    id: 'KHATA-101',
    farmer_id: '1',
    farmer_code: 'FMR-2026-0156',
    farmer_name: 'Rahul Jadhav',
    mobile: '9876543210',
    village: 'Kopargaon',
    district: 'Ahmednagar',
    total_credit: 8500,
    total_paid: 6650,
    current_pending: 1850,
    overdue_amount: 0,
    oldest_due_date: '2026-09-20',
    credit_limit: 25000,
    status: 'Pending',
    last_payment_date: '2026-09-05',
    last_payment_amount: 2000,
    credit_risk: 'Low Risk',
    unsettled_invoices: [
      { id: 'AGM-2026-00048', date: '2026-09-08', total: 3654, paid: 1804, pending: 1850, due_date: '2026-09-20' }
    ]
  }
];

export const initialMasterCreditLedger = [
  {
    id: 'TXN-1008',
    date: '2026-09-08 10:15 AM',
    farmer_id: '1',
    farmer_name: 'Rahul Jadhav',
    transaction_type: 'Credit Sale',
    reference: 'AGM-2026-00048',
    debit: 1654,
    credit: 0,
    running_balance: 1850,
    due_date: '2026-09-20',
    status: 'Pending',
    user: 'Admin',
    notes: 'DAP 50kg + Urea 45kg credit billing'
  }
];

export const initialCreditTrend = [
  { month: 'Apr', credit_given: 62000, collected: 54000 },
  { month: 'May', credit_given: 78000, collected: 68000 },
  { month: 'Jun', credit_given: 95000, collected: 81000 },
  { month: 'Jul', credit_given: 88000, collected: 79000 },
  { month: 'Aug', credit_given: 92000, collected: 74000 },
  { month: 'Sep', credit_given: 82000, collected: 65800 }
];

export const initialCreditAgingData = [
  { bucket: '0–7 Days', amount: 32400, count: 8, color: '#10B981' },
  { bucket: '8–15 Days', amount: 24700, count: 6, color: '#3B82F6' },
  { bucket: '16–30 Days', amount: 18250, count: 5, color: '#F59E0B' },
  { bucket: '31–60 Days', amount: 29600, count: 3, color: '#F97316' },
  { bucket: '60+ Days', amount: 19550, count: 1, color: '#EF4444' }
];

// Rule-Based Credit Risk Calculator
export const calculateCreditRisk = (pendingAmount, creditLimit, isOverdue, daysOverdue) => {
  if (pendingAmount <= 0) return 'Low Risk';
  const usageRatio = pendingAmount / (creditLimit || 10000);
  
  if (isOverdue || daysOverdue > 15 || usageRatio > 0.85) {
    return 'High Risk';
  } else if (daysOverdue > 0 || usageRatio > 0.5) {
    return 'Medium Risk';
  }
  return 'Low Risk';
};

// =========================================================================
// REAL SUPABASE LIVE CREDIT SERVICES
// =========================================================================

export async function getCreditSummary() {
  try {
    const { data: farmers, error: fError } = await supabase.from('farmers').select('*');
    if (fError) throw fError;

    const { data: bills, error: bError } = await supabase.from('bills').select('*');
    if (bError) throw bError;

    const { data: payments, error: pError } = await supabase.from('payments').select('*');
    if (pError) throw pError;

    const totalOutstandingCredit = (farmers || []).reduce((sum, f) => sum + (Number(f.pending_credit) || 0), 0);
    const pendingFarmersCount = (farmers || []).filter(f => (Number(f.pending_credit) || 0) > 0).length;

    const todayStr = new Date().toISOString().split('T')[0];

    const totalOverdueAmount = (bills || [])
      .filter(b => (Number(b.pending_amount) || 0) > 0 && b.due_date && new Date(b.due_date) < new Date(todayStr))
      .reduce((sum, b) => sum + (Number(b.pending_amount) || 0), 0);

    const dueThisWeekAmount = (bills || [])
      .filter(b => {
        if (!b.due_date || (Number(b.pending_amount) || 0) <= 0) return false;
        const dueDate = new Date(b.due_date);
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        return dueDate >= today && dueDate <= nextWeek;
      })
      .reduce((sum, b) => sum + (Number(b.pending_amount) || 0), 0);

    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const paymentsReceivedThisMonth = (payments || [])
      .filter(p => p.created_at >= firstDayOfMonth && p.payment_type === 'FARMER_CREDIT_REPAYMENT')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const avgCreditPerFarmer = pendingFarmersCount > 0 ? Math.round(totalOutstandingCredit / pendingFarmersCount) : 0;

    return {
      totalOutstandingCredit,
      pendingFarmersCount,
      totalOverdueAmount,
      dueThisWeekAmount,
      paymentsReceivedThisMonth,
      avgCreditPerFarmer
    };
  } catch (err) {
    console.error('Error fetching credit summary from Supabase:', err);
    return null;
  }
}

export async function getFarmersWithCredit() {
  try {
    const { data: farmers, error: fErr } = await supabase.from('farmers').select('*');
    if (fErr) throw fErr;

    const { data: bills, error: bErr } = await supabase.from('bills').select('*');
    if (bErr) throw bErr;

    const { data: payments, error: pErr } = await supabase.from('payments').select('*');
    if (pErr) throw pErr;

    const todayStr = new Date().toISOString().split('T')[0];

    const creditAccounts = (farmers || []).map(f => {
      const farmerBills = (bills || []).filter(b => Number(b.farmer_id) === Number(f.id));
      const farmerPayments = (payments || []).filter(p => Number(p.farmer_id) === Number(f.id) && p.payment_type === 'FARMER_CREDIT_REPAYMENT');

      const totalCredit = farmerBills.reduce((sum, b) => sum + (Number(b.grand_total) || 0), 0);
      const totalPaid = farmerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const currentPending = Number(f.pending_credit) || 0;

      const pendingBills = farmerBills.filter(b => (Number(b.pending_amount) || 0) > 0);
      const overdueBills = pendingBills.filter(b => b.due_date && new Date(b.due_date) < new Date(todayStr));
      const overdueAmount = overdueBills.reduce((sum, b) => sum + (Number(b.pending_amount) || 0), 0);

      let oldestDueDate = 'N/A';
      if (pendingBills.length > 0) {
        const sortedDue = [...pendingBills].sort((a, b) => new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31'));
        if (sortedDue[0].due_date) {
          oldestDueDate = sortedDue[0].due_date.split('T')[0];
        }
      }

      let lastPaymentDate = 'N/A';
      let lastPaymentAmount = 0;
      if (farmerPayments.length > 0) {
        const sortedPayments = [...farmerPayments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        lastPaymentDate = sortedPayments[0].created_at ? sortedPayments[0].created_at.split('T')[0] : 'N/A';
        lastPaymentAmount = Number(sortedPayments[0].amount) || 0;
      }

      let status = 'Cleared';
      if (currentPending > 0) {
        if (overdueAmount > 0) status = 'Overdue';
        else if (totalPaid > 0) status = 'Partially Paid';
        else status = 'Pending';
      }

      const unsettledInvoices = pendingBills.map(b => ({
        id: b.invoice_number,
        date: b.invoice_date ? b.invoice_date.split('T')[0] : 'N/A',
        total: Number(b.grand_total) || 0,
        paid: Number(b.paid_amount) || 0,
        pending: Number(b.pending_amount) || 0,
        due_date: b.due_date ? b.due_date.split('T')[0] : 'N/A'
      }));

      const creditRisk = calculateCreditRisk(currentPending, f.credit_limit, overdueAmount > 0, overdueAmount > 0 ? 16 : 0);

      return {
        id: `KHATA-${f.id}`,
        farmer_id: f.id,
        farmer_code: f.farmer_code || `FMR-${f.id}`,
        farmer_name: f.name,
        mobile: f.mobile || '',
        village: f.village || '',
        district: f.district || '',
        total_credit: totalCredit || currentPending,
        total_paid: totalPaid,
        current_pending: currentPending,
        overdue_amount: overdueAmount,
        oldest_due_date: oldestDueDate,
        credit_limit: Number(f.credit_limit) || 50000,
        status,
        last_payment_date: lastPaymentDate,
        last_payment_amount: lastPaymentAmount,
        credit_risk: creditRisk,
        unsettled_invoices: unsettledInvoices
      };
    });

    return creditAccounts;
  } catch (err) {
    console.error('Error fetching farmers credit from Supabase:', err);
    return [];
  }
}

export async function getFarmerLedger(farmerId = null) {
  try {
    let query = supabase.from('credit_transactions').select(`
      *,
      farmers ( id, name, farmer_code )
    `).order('created_at', { ascending: false });

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }

    const { data: txns, error: tErr } = await query;
    if (tErr) throw tErr;

    return (txns || []).map(t => ({
      id: `TXN-${t.id}`,
      date: t.created_at ? new Date(t.created_at).toLocaleString() : 'N/A',
      farmer_id: t.farmer_id,
      farmer_name: t.farmers ? t.farmers.name : 'Unknown Farmer',
      transaction_type: t.transaction_type === 'DEBIT' ? 'Credit Sale' : t.transaction_type === 'CREDIT' ? 'Payment Received' : t.transaction_type,
      reference: t.payment_id ? `PAY-${t.payment_id}` : `TXN-${t.id}`,
      debit: t.transaction_type === 'DEBIT' ? Number(t.amount) : 0,
      credit: t.transaction_type === 'CREDIT' ? Number(t.amount) : 0,
      running_balance: Number(t.balance_after) || 0,
      due_date: 'N/A',
      status: t.transaction_type === 'CREDIT' ? 'Received' : 'Pending',
      user: 'Admin',
      notes: t.notes || ''
    }));
  } catch (err) {
    console.error('Error fetching credit ledger from Supabase:', err);
    return [];
  }
}

export async function recordFarmerPayment({ farmer_id, payment_amount, payment_method, notes }) {
  try {
    const payAmt = Number(payment_amount);
    if (!farmer_id || payAmt <= 0) {
      return { success: false, error: 'Invalid farmer or payment amount' };
    }

    // Attempt RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('record_farmer_payment', {
      p_farmer_id: Number(farmer_id),
      p_amount: payAmt,
      p_payment_method: payment_method || 'Cash',
      p_notes: notes || 'Farmer credit repayment'
    });

    if (!rpcErr && rpcData) {
      return { success: true, data: rpcData };
    }

    console.warn('RPC record_farmer_payment unavailable or errored, executing direct Supabase payment transaction:', rpcErr?.message);

    // Fallback: Direct Supabase client transaction
    const { data: farmer, error: fErr } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', farmer_id)
      .single();

    if (fErr || !farmer) {
      return { success: false, error: fErr ? fErr.message : 'Farmer not found' };
    }

    const currentPending = Number(farmer.pending_credit) || 0;
    const newPending = Math.max(0, currentPending - payAmt);
    const payNo = `PAY-FMR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const { error: upErr } = await supabase
      .from('farmers')
      .update({ pending_credit: newPending })
      .eq('id', farmer_id);

    if (upErr) throw upErr;

    const { data: payRecord } = await supabase
      .from('payments')
      .insert([{
        payment_number: payNo,
        farmer_id: farmer_id,
        payment_type: 'FARMER_CREDIT_REPAYMENT',
        amount: payAmt,
        payment_method: payment_method || 'Cash',
        notes: notes || 'Farmer credit repayment'
      }])
      .select()
      .single();

    await supabase
      .from('credit_transactions')
      .insert([{
        farmer_id: farmer_id,
        payment_id: payRecord ? payRecord.id : null,
        transaction_type: 'CREDIT',
        amount: payAmt,
        balance_after: newPending,
        notes: notes || `Repayment on Receipt ${payNo}`
      }]);

    const { data: pendingBills } = await supabase
      .from('bills')
      .select('*')
      .eq('farmer_id', farmer_id)
      .gt('pending_amount', 0)
      .order('created_at', { ascending: true });

    if (pendingBills && pendingBills.length > 0) {
      let remPay = payAmt;
      for (const bill of pendingBills) {
        if (remPay <= 0) break;
        const billPending = Number(bill.pending_amount) || 0;
        const alloc = Math.min(remPay, billPending);
        const newPaid = (Number(bill.paid_amount) || 0) + alloc;
        const newBillPending = Math.max(0, billPending - alloc);
        const newStatus = newBillPending === 0 ? 'Paid' : 'Partial';

        await supabase
          .from('bills')
          .update({
            paid_amount: newPaid,
            pending_amount: newBillPending,
            payment_status: newStatus
          })
          .eq('id', bill.id);

        remPay -= alloc;
      }
    }

    return {
      success: true,
      data: {
        farmer_id,
        payment_number: payNo,
        amount_paid: payAmt,
        remaining_pending_credit: newPending
      }
    };
  } catch (err) {
    console.error('Error executing farmer payment:', err);
    return { success: false, error: err.message || err };
  }
}
