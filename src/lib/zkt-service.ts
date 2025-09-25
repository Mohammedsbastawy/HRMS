'use server';

import ZKLib from 'node-zklib';

// --- Configuration ---
// Use the environment variable for the device's IP address.
const ZKT_IP = process.env.ZKTECO_IP || '192.168.1.201'; // Default if not set
const ZKT_PORT = 4370;
const ZKT_TIMEOUT = 5000; // 5 seconds

/**
 * Connects to the ZKTeco device, fetches attendance logs, and disconnects.
 * This function simulates fetching data if it cannot connect to a real device.
 */
export async function syncAttendance() {
  let zkInstance: ZKLib | null = null;
  
  // Do not proceed if the IP is the default and likely incorrect.
  if (!process.env.ZKTECO_IP) {
      console.warn('ZKTECO_IP environment variable is not set. Using default and entering simulation mode.');
      return {
        success: false,
        error: 'لم يتم تعيين عنوان IP للجهاز في الإعدادات. يرجى التكوين أولاً.',
        records: [],
      };
  }
  
  try {
    zkInstance = new ZKLib(ZKT_IP, ZKT_PORT, ZKT_TIMEOUT, 5000);
    
    // Connect to the device
    await zkInstance.createSocket();
    console.log(`Connected to ZKTeco device at ${ZKT_IP}`);

    // Get attendance logs
    const logs = await zkInstance.getAttendances();
    console.log(`Found ${logs.data.length} attendance logs.`);

    // In a real scenario, you'd process these logs and save to a database.
    return { success: true, records: logs.data };

  } catch (e: any) {
    console.error('Error connecting to ZKTeco device:', e.message);
    
    // --- SIMULATION FOR DEMO PURPOSES ---
    // If connection fails, return mock data to demonstrate UI functionality.
    console.log('Falling back to simulation mode due to connection error.');
    const mockRecords = [
      { userId: '1', recordTime: '2024-07-29 09:01:00', attState: 0, uid: 'mock1' },
      { userId: '2', recordTime: '2024-07-29 09:03:00', attState: 0, uid: 'mock2' },
      { userId: '1', recordTime: '2024-07-29 17:35:00', attState: 1, uid: 'mock3' },
      { userId: '2', recordTime: '2024-07-29 18:05:00', attState: 1, uid: 'mock4' },
    ];
    
    return {
      success: false,
      error: `فشل الاتصال بالجهاز. ${e.message}. عرض بيانات محاكاة.`,
      records: mockRecords, // Return mock data on failure for demo
    };
  } finally {
    // Ensure the connection is always closed
    if (zkInstance) {
      await zkInstance.disconnect();
      console.log('Disconnected from ZKTeco device.');
    }
  }
}
