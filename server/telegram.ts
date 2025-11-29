import axios from 'axios';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

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

export async function sendPaymentNotification(username: string, amount: number): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const message = `🚨 <b>แจ้งฝากเงินใหม่!</b>
👤 ผู้ใช้: ${username}
💰 จำนวน: ${amount.toLocaleString()} บาท
⏰ เวลา: ${timestamp}`;
  
  return sendTelegramMessage(message);
}

export async function sendWithdrawalNotification(username: string, amount: number): Promise<boolean> {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const message = `💸 <b>คำขอถอนเงินใหม่!</b>
👤 ผู้ใช้: ${username}
💰 จำนวน: ${amount.toLocaleString()} บาท
⏰ เวลา: ${timestamp}`;
  
  return sendTelegramMessage(message);
}
