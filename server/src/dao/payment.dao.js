import { db } from '../config/database.config.js';
import { payments } from '../db/schema/payments.schema.js';
import { eq } from 'drizzle-orm';

/**
 * Create a new payment record in the database.
 * @param {object} paymentData - Payment details matching the schema.
 * @param {object} [tx=db] - Database or transaction instance.
 * @returns {Promise<object>} The created payment record.
 */
export async function createPaymentRecord(paymentData, tx = db) {
    const [payment] = await tx.insert(payments).values(paymentData).returning();
    return payment;
}

/**
 * Fetch a payment record by its associated Booking ID.
 * @param {string} bookingId
 * @param {object} [tx=db]
 * @returns {Promise<object|null>}
 */
export async function getPaymentByBookingId(bookingId, tx = db) {
    const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.bookingId, bookingId))
        .limit(1);
    return payment || null;
}

/**
 * Fetch a payment record by its primary key ID.
 * @param {string} paymentId
 * @param {object} [tx=db]
 * @returns {Promise<object|null>}
 */
export async function getPaymentById(paymentId, tx = db) {
    const [payment] = await tx.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    return payment || null;
}

/**
 * Update a payment record by its associated Booking ID.
 * @param {string} bookingId
 * @param {object} updates - Updates to columns (e.g. status, paymentId, paidAt)
 * @param {object} [tx=db]
 * @returns {Promise<object|null>}
 */
export async function updatePaymentByBookingId(bookingId, updates, tx = db) {
    const [payment] = await tx
        .update(payments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(payments.bookingId, bookingId))
        .returning();
    return payment || null;
}

/**
 * Update a payment record in the database by its Razorpay Order ID.
 * @param {string} orderId - The order ID from Razorpay.
 * @param {object} updates - Column updates (e.g. paymentId, signature, status).
 * @param {object} [tx=db]
 * @returns {Promise<object|null>} The updated payment record or null if not found.
 */
export async function updatePaymentByOrderId(orderId, updates, tx = db) {
    const [payment] = await tx
        .update(payments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(payments.orderId, orderId))
        .returning();
    return payment || null;
}

/**
 * Fetch a payment record by its Razorpay Order ID.
 * @param {string} orderId - The order ID from Razorpay.
 * @param {object} [tx=db]
 * @returns {Promise<object|null>} The payment record or null if not found.
 */
export async function getPaymentByOrderId(orderId, tx = db) {
    const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);
    return payment || null;
}

/**
 * Fetch a payment record by its Razorpay Payment ID.
 * @param {string} paymentId - The payment ID returned from Razorpay.
 * @param {object} [tx=db]
 * @returns {Promise<object|null>} The payment record or null if not found.
 */
export async function getPaymentByPaymentId(paymentId, tx = db) {
    const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.paymentId, paymentId))
        .limit(1);
    return payment || null;
}
