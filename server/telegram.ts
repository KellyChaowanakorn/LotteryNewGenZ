import axios from 'axios';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const lotteryTypeNames: Record<string, string> = {
  THAI_GOV: "หวยรัฐบาลไทย",
  THAI_STOCK: "หุ้นไทย",
  NIKKEI: "หุ้นนิเคอิ",
  DOW_JONES: "หุ้นดาวโจนส์",
  FTSE: "หุ้น FTSE",
  DAX: "หุ้น DAX",
  LAOS: "หวยลาว",
  HANOI: "หวยฮานอย",
  MALAYSIA: "หวยมาเลเซีย",
  SINGAPORE: "หวยสิงคโปร์",
  YEEKEE: "หวยยี่กี",
  KENO: "หวยคีโน"
};

const betTypeNames: Record<string, string> = {
  THREE_TOP: "3 ตัวบน",
  THREE_TOOD: "3 ตัวโต๊ด",
  THREE_FRONT: "3 ตัวหน้า",
  THREE_BOTTOM: "3 ตัวล่าง",
  THREE_REVERSE: "3 ตัวกลับ",
  TWO_TOP: "2 ตัวบน",
  TWO_BOTTOM: "2 ตัวล่าง",
  RUN_TOP: "วิ่งบน",
  RUN_BOTTOM: "วิ่งล่าง"
};

export async function sendTelegramMessage(message: string): Promise<boolean> {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.log('Telegram credentials not configured');
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
      console.log('Telegram notification sent successfully');
      return true;
    } else {
      console.log('Telegram error:', response.status);
      return false;
    }
  } catch (error: any) {
    console.log('Telegram error:', error.message);
    return false;
  }
}

export interface DepositNotificationData {
  username: string;
  userId: number;
  amount: number;
  hasSlip?: boolean;
  ip?: string;
}

export async function sendPaymentNotification(data: DepositNotificationData): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const slipStatus = data.hasSlip ? '📎 แนบสลิปแล้ว' : '⚠️ ยังไม่ได้แนบสลิป';
  const message = `🚨 <b>คำขอฝากเงินใหม่!</b>
👤 ผู้ใช้: ${data.username}
🆔 ID: ${data.userId}
💰 จำนวน: ${data.amount.toLocaleString()} บาท
${slipStatus}
⏰ เวลา: ${timestamp}${data.ip ? `\n📍 IP: ${data.ip}` : ''}

📲 กรุณาตรวจสอบในหน้า Admin`;
  
  return sendTelegramMessage(message);
}

export interface WithdrawalNotificationData {
  username: string;
  userId: number;
  amount: number;
  ip?: string;
}

export async function sendWithdrawalNotification(data: WithdrawalNotificationData): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const message = `💸 <b>คำขอถอนเงินใหม่!</b>
👤 ผู้ใช้: ${data.username}
🆔 ID: ${data.userId}
💰 จำนวน: ${data.amount.toLocaleString()} บาท
⏰ เวลา: ${timestamp}${data.ip ? `\n📍 IP: ${data.ip}` : ''}`;
  
  return sendTelegramMessage(message);
}

export interface BetItem {
  lotteryType: string;
  betType: string;
  numbers: string;
  amount: number;
}

export interface BetNotificationData {
  username: string;
  userId: number;
  items: BetItem[];
  totalAmount: number;
  ip?: string;
}

export async function sendBetNotification(data: BetNotificationData): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  
  let betDetails = '';
  data.items.forEach((item, index) => {
    const lotteryName = lotteryTypeNames[item.lotteryType] || item.lotteryType;
    const betTypeName = betTypeNames[item.betType] || item.betType;
    betDetails += `\n${index + 1}. 🎰 ${lotteryName}`;
    betDetails += `\n   📋 ประเภท: ${betTypeName}`;
    betDetails += `\n   🔢 เลข: ${item.numbers}`;
    betDetails += `\n   💵 เดิมพัน: ${item.amount.toLocaleString()} บาท`;
  });
  
  const message = `🎯 <b>ซื้อหวยใหม่!</b>
👤 ผู้ใช้: ${data.username}
🆔 ID: ${data.userId}
${betDetails}
━━━━━━━━━━━━━━━
💰 <b>รวมทั้งหมด: ${data.totalAmount.toLocaleString()} บาท</b>
⏰ เวลา: ${timestamp}${data.ip ? `\n📍 IP: ${data.ip}` : ''}`;
  
  return sendTelegramMessage(message);
}

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
💰 จำนวน: ${data.amount.toLocaleString()} บาท
🔖 รหัสธุรกรรม: #${data.transactionId}
⏰ เวลา: ${timestamp}`;
  
  return sendTelegramMessage(message);
}
