import Razorpay from 'razorpay';
import crypto from 'crypto';
import envConfig from '../config/env.config.js';
import {
    createPaymentRecord,
    updatePaymentByOrderId,
    getPaymentByOrderId,
    getPaymentByPaymentId,
} from '../dao/payment.dao.js';

// Initialize Razorpay client
const razorpay = new Razorpay({
    key_id: envConfig.RAZORPAY_KEY_ID,
    key_secret: envConfig.RAZORPAY_KEY_SECRET,
});

/**
 * Create a generalized Razorpay Order and save details to the DB.
 * @param {object} params
 * @param {number} params.amount - The amount to charge (in the smallest unit of currency, e.g. paise for INR).
 * @param {string} [params.currency='INR'] - The currency code.
 * @param {string} [params.receipt] - Receipt identifier.
 * @param {object} [params.notes] - Custom metadata key-value pairs.
 * @returns {Promise<object>} The Razorpay order details along with DB record.
 */
export async function createOrder({ amount, currency = 'INR', receipt, notes }) {
    try {
        const options = {
            amount,
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes || {},
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Save order info to DB
        const paymentRecord = await createPaymentRecord({
            orderId: razorpayOrder.id,
            amount,
            currency,
            status: 'pending',
        });

        return {
            razorpayOrder,
            paymentRecord,
        };
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
}

/**
 * Verify Razorpay payment signature and update the DB record.
 * @param {object} params
 * @param {string} params.razorpayOrderId - The order ID returned by Razorpay.
 * @param {string} params.razorpayPaymentId - The payment ID returned by Razorpay.
 * @param {string} params.signature - The signature hash sent from front-end/webhook.
 * @returns {Promise<object>} The updated payment record.
 */
export async function verifyPayment({ razorpayOrderId, razorpayPaymentId, signature }) {
    try {
        // Construct standard Razorpay signature body: orderId + '|' + paymentId
        const body = razorpayOrderId + '|' + razorpayPaymentId;

        const expectedSignature = crypto
            .createHmac('sha256', envConfig.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            throw new Error('Invalid signature verification failed');
        }

        // Signature is valid. Update DB record to completed.
        const updatedRecord = await updatePaymentByOrderId(razorpayOrderId, {
            paymentId: razorpayPaymentId,
            signature,
            status: 'completed',
        });

        if (!updatedRecord) {
            throw new Error(`Payment record not found for Order ID: ${razorpayOrderId}`);
        }

        return updatedRecord;
    } catch (error) {
        console.error('Error verifying Razorpay payment:', error);
        throw error;
    }
}

/**
 * Fetch details of a payment directly from Razorpay.
 * @param {string} paymentId - Razorpay payment ID.
 * @returns {Promise<object>} Razorpay payment details.
 */
export async function getRazorpayPaymentDetails(paymentId) {
    try {
        return await razorpay.payments.fetch(paymentId);
    } catch (error) {
        console.error(`Error fetching payment details for ID ${paymentId}:`, error);
        throw error;
    }
}

/**
 * Refund a verified payment via Razorpay and update local record if desired.
 * @param {object} params
 * @param {string} params.paymentId - Razorpay payment ID.
 * @param {number} [params.amount] - Amount to refund (in smallest currency unit). Defaults to full refund.
 * @param {object} [params.notes] - Custom notes for the refund.
 * @returns {Promise<object>} Razorpay refund details.
 */
export async function refundPayment({ paymentId, amount, notes }) {
    try {
        const options = {};
        if (amount) options.amount = amount;
        if (notes) options.notes = notes;

        const refund = await razorpay.payments.refund(paymentId, options);

        // Fetch local payment record and update status to refunded/partially_refunded
        const localPayment = await getPaymentByPaymentId(paymentId);
        if (localPayment) {
            await updatePaymentByOrderId(localPayment.orderId, {
                status: amount && amount < localPayment.amount ? 'partially_refunded' : 'refunded',
            });
        }

        return refund;
    } catch (error) {
        console.error(`Error refunding payment for ID ${paymentId}:`, error);
        throw error;
    }
}

/**
 * Retrieve local payment record by Order ID.
 * @param {string} orderId
 */
export async function getLocalPaymentByOrderId(orderId) {
    return await getPaymentByOrderId(orderId);
}

/**
 * Retrieve local payment record by Payment ID.
 * @param {string} paymentId
 */
export async function getLocalPaymentByPaymentId(paymentId) {
    return await getPaymentByPaymentId(paymentId);
}
