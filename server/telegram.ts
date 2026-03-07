import axios from 'axios';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/* =========================
   ★ FIX: ชื่อหวยตรงกับ schema 6 ชนิด
========================= */

const lotteryTypeNames: Record<string, string> = {
  THAI_GOV: "หวยรัฐบาลไทย",
  THAI_STOCK: "หุ้นไทย",
  STOCK_NIKKEI: "หุ้นนิเคอิ",
  STOCK_HSI: "หุ้นฮั่งเส็ง",
  STOCK_DOW: "หุ้นดาวโจนส์",
  MALAYSIA: "หวยมาเลเซีย",
};

/* =========================
   ★ FIX: ชื่อ bet type ครบ 11 ตัว
========================= */

const betTypeNames: Record<string, string> = {
  TWO_TOP: "2 ตัวบน",
  TWO_BOTTOM: "2 ตัวล่าง",
  THREE_TOP: "3 ตัวบน",
  THREE_TOD: "3 ตัวโต๊ด",
  THREE_FRONT: "3 ตัวหน้า",
  THREE_BACK: "3 ตัวท้าย",
  FOUR_TOP: "4 ตัว",
  FIVE_TOP: "5 ตัว",
  RUN_TOP: "วิ่งบน",
  RUN_BOTTOM: "วิ่งล่าง",
  REVERSE: "เลขกลับ",
};

/* =========================
   SEND MESSAGE
========================= */

export async function sendTelegramMessage(message: string): Promise<boolean> {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.log('⚠️ Telegram credentials not configured (TELEGRAM_TOKEN or CHAT_ID missing)');
    return false;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    const response = await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    if (response.status === 200) {
      console.log('✅ Telegram notification sent');
      return true;
    } else {
      console.log('❌ Telegram error:', response.status);
      return false;
    }
  } catch (error: any) {
    console.log('❌ Telegram error:', error.message);
    return false;
  }
}

/* =========================
   DEPOSIT NOTIFICATION
========================= */

export interface DepositNotificationData {
  username: string;
  userId: number;
  amount: number;
  reference: string;
  hasSlip?: boolean;
}

export async function sendPaymentNotification(data: DepositNotificationData): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const slipStatus = data.hasSlip ? '📎 แนบสลิปแล้ว' : '⚠️ ยังไม่ได้แนบสลิป';
  const message = `🚨 <b>คำขอฝากเงินใหม่!</b>
📋 ประเภท: ฝากเงิน
👤 ผู้ใช้: ${data.username}
🆔 ID: ${data.userId}
💰 จำนวน: ${data.amount.toLocaleString()} บาท
🔖 รหัสธุรกรรม: ${data.reference}
${slipStatus}
⏰ เวลา: ${timestamp}

📲 กรุณาตรวจสอบและอนุมัติในหน้า Admin`;

  return sendTelegramMessage(message);
}

/* =========================
   WITHDRAWAL NOTIFICATION
========================= */

export interface WithdrawalNotificationData {
  username: string;
  userId: number;
  amount: number;
  reference: string;
}

export async function sendWithdrawalNotification(data: WithdrawalNotificationData): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const message = `💸 <b>คำขอถอนเงินใหม่!</b>
📋 ประเภท: ถอนเงิน
👤 ผู้ใช้: ${data.username}
🆔 ID: ${data.userId}
💰 จำนวน: ${Math.abs(data.amount).toLocaleString()} บาท
🔖 รหัสธุรกรรม: ${data.reference}
⏰ เวลา: ${timestamp}

📲 กรุณาตรวจสอบและอนุมัติในหน้า Admin`;

  return sendTelegramMessage(message);
}

/* =========================
   BET / CHECKOUT NOTIFICATION
========================= */

export interface BetItem {
  lotteryType: string;
  betType: string;
  numbers: string;
  amount: number;
  isSet?: boolean;
  setIndex?: number;
}

export interface BetNotificationData {
  username: string;
  userId: number;
  items: BetItem[];
  totalAmount: number;
}

export async function sendBetNotification(data: BetNotificationData): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  // Group items by lotteryType + betType
  const groups: Record<string, BetItem[]> = {};
  for (const item of data.items) {
    const key = `${item.lotteryType}|${item.betType}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  let betDetails = '';

  for (const [key, groupItems] of Object.entries(groups)) {
    const [lotteryType, betType] = key.split('|');
    const lotteryName = lotteryTypeNames[lotteryType] || lotteryType;
    const betTypeName = betTypeNames[betType] || betType;
    const groupTotal = groupItems.reduce((sum, i) => sum + i.amount, 0);

    if (groupItems.length > 1) {
      // หวยชุด (multiple numbers same type)
      betDetails += `\n📦 <b>หวยชุด (${betTypeName})</b>`;
      betDetails += `\n🎰 ${lotteryName} | ${betTypeName}`;
      groupItems.forEach((item, idx) => {
        betDetails += `\n   ชุดที่ ${idx + 1}: ${item.numbers} (${item.amount.toLocaleString()} บาท)`;
      });
      betDetails += `\n   💵 รวม ${betTypeName}: ${groupTotal.toLocaleString()} บาท`;
    } else {
      // เลขเดี่ยว
      const item = groupItems[0];
      betDetails += `\n🎰 ${lotteryName} | ${betTypeName}`;
      betDetails += `\n   🔢 เลข: ${item.numbers}`;
      betDetails += `\n   💵 เดิมพัน: ${item.amount.toLocaleString()} บาท`;
    }
  }

  const hasMultipleGroups = Object.keys(groups).length > 1 || data.items.length > 1;
  const title = hasMultipleGroups
    ? '📦 <b>ซื้อหวยชุดใหม่!</b>'
    : '🎯 <b>ซื้อหวยใหม่!</b>';

  const message = `${title}
👤 ผู้ใช้: ${data.username}
🆔 ID: ${data.userId}
${betDetails}
━━━━━━━━━━━━━━━
💰 <b>รวมทั้งหมด: ${data.totalAmount.toLocaleString()} บาท</b>
⏰ เวลา: ${timestamp}`;

  return sendTelegramMessage(message);
}

/* =========================
   ADMIN APPROVE / REJECT NOTIFICATION
========================= */

export interface AdminActionNotificationData {
  username: string;
  userId: number;
  transactionType: 'deposit' | 'withdrawal';
  amount: number;
  action: 'approved' | 'rejected';
  transactionId: number;
}

export async function sendAdminActionNotification(data: AdminActionNotificationData): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  const actionEmoji = data.action === 'approved' ? '✅' : '❌';
  const actionText = data.action === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
  const typeText = data.transactionType === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน';

  const message = `${actionEmoji} <b>Admin ${actionText}!</b>
📋 ประเภท: ${typeText}
👤 ผู้ใช้: ${data.username}
🆔 ID: ${data.userId}
💰 จำนวน: ${Math.abs(data.amount).toLocaleString()} บาท
🔖 รหัสธุรกรรม: #${data.transactionId}
⏰ เวลา: ${timestamp}`;

  return sendTelegramMessage(message);
}

/* =========================
   WINNERS NOTIFICATION
========================= */

export interface WinnerInfo {
  username: string;
  userId: number;
  betType: string;
  numbers: string;
  amount: number;
  winAmount: number;
  matchedNumber?: string;
}

export interface WinnersNotificationData {
  lotteryType: string;
  drawDate: string;
  winners: WinnerInfo[];
  totalPayout: number;
}

export async function sendWinnersNotification(data: WinnersNotificationData): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const lotteryName = lotteryTypeNames[data.lotteryType] || data.lotteryType;

  let winnerDetails = '';
  data.winners.forEach((winner, index) => {
    const betTypeName = betTypeNames[winner.betType] || winner.betType;
    winnerDetails += `\n${index + 1}. 👤 ${winner.username} (ID: ${winner.userId})`;
    winnerDetails += `\n   📋 ${betTypeName} | เลข: ${winner.numbers}`;
    if (winner.matchedNumber) {
      winnerDetails += ` → ถูก: ${winner.matchedNumber}`;
    }
    winnerDetails += `\n   💵 เดิมพัน: ${winner.amount.toLocaleString()} → ได้: ${winner.winAmount.toLocaleString()} บาท`;
  });

  const message = `🎉🎉🎉 <b>มีผู้ถูกรางวัล!</b> 🎉🎉🎉

🎰 <b>${lotteryName}</b>
📅 งวดวันที่: ${data.drawDate}
🏆 จำนวนผู้ถูกรางวัล: ${data.winners.length} คน
💰 รวมเงินรางวัลที่ต้องจ่าย: ${data.totalPayout.toLocaleString()} บาท

<b>รายละเอียดผู้ถูกรางวัล:</b>
${winnerDetails}

⏰ ประมวลผลเมื่อ: ${timestamp}`;

  return sendTelegramMessage(message);
}
