import { format } from 'date-fns';

const getMyName = () => localStorage.getItem('user_name') || 'Me';
const getMyUpi = () => localStorage.getItem('my_upi_id') || '';

// Type 1: Personal Reminder
export const formatWhatsAppReminder = (friend, balance, outings) => {
  const upi = getMyUpi();
  const myName = getMyName();

  let text = `Hey ${friend.name}! 👋\n\nJust a friendly reminder about our recent outings together 🍽️\n\n📋 Expense Summary:\n`;

  outings.forEach(o => {
    const theirShare = o.participants.find(p => p.id === friend.id)?.share || 0;
    if (theirShare > 0) {
      text += `  • ${format(new Date(o.date), 'EEEE (MMM dd)')} — ${o.name}: ₹${theirShare.toFixed(0)}\n`;
    }
  });

  text += `\n💰 Total you owe: ₹${Math.abs(balance).toFixed(0)}\n`;
  if (upi) text += `💳 UPI: ${upi}\n`;
  
  text += `\nNo rush, pay whenever you're free! 😊\n— ${myName}`;
  
  return text;
};

// Type 2: Outing Summary
export const formatGroupSummary = (outing, friends) => {
  const myName = getMyName();
  const payerName = outing.paidBy === 'me' ? myName : friends.find(f => f.id === outing.paidBy)?.name || 'Someone';
  
  let text = `🍽️ ${outing.name} — ${format(new Date(outing.date), 'MMM dd, yyyy')}\n\n👥 Who came:\n`;
  
  text += `  • ${payerName} (paid)\n`;
  
  outing.participants.forEach(p => {
    if (p.id !== outing.paidBy) {
      const pName = p.id === 'me' ? myName : (friends.find(f => f.id === p.id)?.name || p.name);
      text += `  • ${pName} owes ${payerName} ₹${p.share.toFixed(0)}\n`;
    }
  });

  text += `\n💰 Total bill: ₹${Number(outing.totalAmount).toLocaleString()}\n`;
  text += `💳 Paid by: ${payerName}\n`;
  
  if (outing.splitType === 'equal') {
    text += `➗ Split: ₹${(outing.totalAmount / outing.participants.length).toFixed(0)} per person\n`;
  } else {
    text += `➗ Split: Custom\n`;
  }

  text += `\nPlease settle up when convenient! 🙏`;
  return text;
};

// Type 3: Monthly Report
export const formatMonthlyReport = (monthOutings, balances, monthlyTotals, friends) => {
  const myName = getMyName();
  
  let text = `📊 ${format(new Date(), 'MMMM yyyy')} Expense Summary\n\nHey everyone! Here's this month's breakdown 👇\n\n`;
  text += `🍽️ Total outings: ${monthOutings.length}\n`;
  text += `💸 Total I paid: ₹${monthlyTotals.paid.toLocaleString()}\n\n`;
  text += `💰 Pending balances:\n`;
  
  let totalPending = 0;
  friends.forEach(f => {
    const bal = balances[f.id] || 0;
    if (bal > 0) {
      text += `  • ${f.name}: ₹${bal.toFixed(0)}\n`;
      totalPending += bal;
    }
  });

  if (totalPending === 0) text += `  • All clear!\n`;

  text += `\n📌 Total pending: ₹${totalPending.toLocaleString()}\n`;
  if (totalPending > 0) text += `Please settle up! 🙏\n\n`;
  text += `— ${myName}`;
  
  return text;
};

// Type 4: Settlement Confirmation
export const formatSettlementConfirmation = (friendName, amountSettled, remainingBalance) => {
  const myName = getMyName();
  
  if (remainingBalance <= 0) {
    return `Hey ${friendName}! ✅\n\nThanks for settling up — ₹${Math.abs(amountSettled).toFixed(0)} received!\n\nWe are all clear now. Looking forward to the next outing! 🍛\n— ${myName}`;
  } else {
    return `Hey ${friendName}! 👍\n\nGot ₹${Math.abs(amountSettled).toFixed(0)}, thanks!\n\nRemaining balance: ₹${remainingBalance.toFixed(0)}\nNo rush on the rest 😊\n— ${myName}`;
  }
};

export const openWhatsApp = (phone, text) => {
  const encoded = encodeURIComponent(text);
  if (phone && phone.trim() !== '') {
    window.open(`https://wa.me/91${phone.replace(/\D/g,'')}?text=${encoded}`);
  } else {
    window.open(`https://wa.me/?text=${encoded}`);
  }
};
