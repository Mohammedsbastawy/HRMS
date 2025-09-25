// This is a placeholder service for ZKTeco device integration.
// It uses node-zklib to connect to the device and fetch attendance logs.
// NOTE: This code is for demonstration and will not work without a real device and network configuration.

// IMPORTANT: ZKTeco integration runs in a Node.js environment. This code is intended for
// server-side execution (e.g., within a Next.js API route), not client-side.
'use server';

import ZKLib from 'node-zklib';

// --- Configuration ---
// Replace with your device's IP address and port.
const ZKT_IP = process.env.ZKTECO_IP || '192.168.1.201'; // Default IP, use environment variable
const ZKT_PORT = 4370;
const ZKT_TIMEOUT = 5000; // 5 seconds

/**
 * Connects to the ZKTeco device, fetches attendance logs, and disconnects.
 * This function simulates fetching data if it cannot connect to a real device.
 */
export async function syncAttendance() {
  let zkInstance: ZKLib | null = null;
  
  try {
    zkInstance = new ZKLib(ZKT_IP, ZKT_PORT, ZKT_TIMEOUT, 5000);
    
    // Connect to the device
    await zkInstance.createSocket();
    console.log(`Connected to ZKTeco device at ${ZKT_IP}`);

    // Get attendance logs
    const logs = await zkInstance.getAttendances();
    console.log(`Found ${logs.data.length} attendance logs.`);

    // Here you would typically process the logs:
    // 1. Map `userId` from device to your `employeeId`.
    // 2. Determine if a log is a 'check-in' or 'check-out'.
    // 3. Save the processed data to your database (e.g., Firestore).
    // For now, we'll just return the raw data.
    
    return { success: true, records: logs.data };

  } catch (e: any) {
    console.error('Error connecting to ZKTeco device:', e.message);
    
    // --- SIMULATION FOR DEMO PURPOSES ---
    // If connection fails, return mock data to demonstrate UI functionality.
    console.log('Falling back to simulation mode.');
    const mockRecords = [
      { userId: '1', recordTime: '2024-07-29 09:01:00', attState: 0 },
      { userId: '2', recordTime: '2024-07-29 09:03:00', attState: 0 },
      { userId: '1', recordTime: '2024-07-29 17:35:00', attState: 1 },
      { userId: '2', recordTime: '2024-07-29 18:05:00', attState: 1 },
    ];
    
    return {
      success: false,
      error: 'فشل الاتصال بالجهاز. عرض بيانات محاكاة.',
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
