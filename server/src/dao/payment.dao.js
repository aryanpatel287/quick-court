import { db } from '../config/database.config.js';
import { payments } from '../db/schema/payments.schema.js';
import { eq } from 'drizzle-orm';

/**
 * Create a new payment record in the database.
 * @param {object} paymentData - Payment details matching the schema.
 * @returns {Promise<object>} The created payment record.
 */
export async function createPaymentRecord(paymentData) {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
}

/**
 * Update a payment record in the database by its Razorpay Order ID.
 * @param {string} orderId - The order ID from Razorpay.
 * @param {object} updates - Column updates (e.g. paymentId, signature, status).
 * @returns {Promise<object|null>} The updated payment record or null if not found.
 */
export async function updatePaymentByOrderId(orderId, updates) {
    const [payment] = await db
        .update(payments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(payments.orderId, orderId))
        .returning();
    return payment || null;
}

/**
 * Fetch a payment record by its Razorpay Order ID.
 * @param {string} orderId - The order ID from Razorpay.
 * @returns {Promise<object|null>} The payment record or null if not found.
 */
export async function getPaymentByOrderId(orderId) {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment || null;
}

/**
 * Fetch a payment record by its Razorpay Payment ID.
 * @param {string} paymentId - The payment ID returned from Razorpay.
 * @returns {Promise<object|null>} The payment record or null if not found.
 */
export async function getPaymentByPaymentId(paymentId) {
    const [payment] = await db.select().from(payments).where(eq(payments.paymentId, paymentId));
    return payment || null;
}
