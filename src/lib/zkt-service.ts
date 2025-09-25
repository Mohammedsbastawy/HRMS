'use server';

import ZKLib from 'node-zklib';

const ZKT_PORT = 4370;
const ZKT_TIMEOUT = 5000; // 5 seconds

async function withZkInstance<T>(
  ip: string,
  user: string | undefined,
  pass: string | undefined,
  callback: (zk: ZKLib) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  let zkInstance: ZKLib | null = null;
  try {
    zkInstance = new ZKLib(ip, ZKT_PORT, ZKT_TIMEOUT, 5000);
    
    await zkInstance.createSocket();
    console.log(`Connected to ZKTeco device at ${ip}`);

    if (user && pass) {
      await zkInstance.lockDevice();
      console.log('Device locked for operation.');
    }

    const result = await callback(zkInstance);

    return { success: true, data: result };
  } catch (e: any) {
    console.error(`Error with ZKTeco device at ${ip}:`, e.message);
    return { success: false, error: e.message };
  } finally {
    if (zkInstance) {
      if (user && pass) {
        try {
          await zkInstance.unlockDevice();
          console.log('Device unlocked.');
        } catch (e) {
          console.error('Error unlocking device:', e);
        }
      }
      await zkInstance.disconnect();
      console.log('Disconnected from ZKTeco device.');
    }
  }
}

/**
 * Tests the connection to the ZKTeco device.
 */
export async function testConnection(ip: string, user?: string, pass?: string) {
    console.log(`Attempting to test connection to ${ip}`);
    const result = await withZkInstance(ip, user, pass, async (zk) => {
        // A simple operation to confirm connection, like getting serial number
        return await zk.getSerialNumber();
    });

    if (result.success) {
        return { success: true, message: `تم الاتصال بنجاح. الرقم التسلسلي للجهاز: ${result.data}` };
    } else {
        return { success: false, error: `فشل الاتصال: ${result.error}` };
    }
}


/**
 * Connects to the ZKTeco device, fetches attendance logs, and disconnects.
 */
export async function syncAttendance(ip: string, user?: string, pass?: string) {
  if (!ip) {
      console.warn('IP address is not provided for syncAttendance.');
      return {
        success: false,
        error: 'لم يتم توفير عنوان IP للجهاز.',
        records: [],
      };
  }

  const result = await withZkInstance(ip, user, pass, async (zk) => {
    const logs = await zk.getAttendances();
    console.log(`Found ${logs.data.length} attendance logs.`);
    return logs.data;
  });

  if (result.success) {
      return { success: true, records: result.data };
  } else {
    // --- SIMULATION FOR DEMO PURPOSES on connection failure ---
    console.log('Falling back to simulation mode due to connection error.');
    const mockRecords = [
      { userId: '1', recordTime: '2024-07-29 09:01:00', attState: 0, uid: 'mock1' },
      { userId: '2', recordTime: '2024-07-29 09:03:00', attState: 0, uid: 'mock2' },
      { userId: '1', recordTime: '2024-07-29 17:35:00', attState: 1, uid: 'mock3' },
      { userId: '2', recordTime: '2024-07-29 18:05:00', attState: 1, uid: 'mock4' },
    ];
    
    return {
      success: false,
      error: `فشل الاتصال بالجهاز. ${result.error}. عرض بيانات محاكاة.`,
      records: mockRecords, // Return mock data on failure for demo
    };
  }
}
