import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const orderController = new OrderController();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new ticket booking order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       409:
 *         description: Conflict (Out of stock or concurrency issue)
 *       400:
 *         description: Bad Request
 */
router.post('/', (req, res) => orderController.create(req, res));

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order UUID
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', (req, res) => orderController.getById(req, res));

/**
 * @swagger
 * /api/orders/{id}/confirm:
 *   patch:
 *     summary: Confirm payment for a pending order (Mock Payment Gateway)
 *     description: |
 *       Simulates a payment gateway call and transitions the order status from "Pending" to "Confirmed".
 *       In production, this would integrate with VNPay/Momo/Stripe.
 *       Rules:
 *       - Only orders with status "Pending" can be confirmed
 *       - Expired orders (past ExpiresAt) cannot be confirmed
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order UUID
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: Confirmed
 *                 totalAmount:
 *                   type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid order status (not Pending)
 *       402:
 *         description: Payment failed
 *       404:
 *         description: Order not found
 *       410:
 *         description: Order expired
 */
router.patch('/:id/confirm', (req, res) => orderController.confirmPayment(req, res));

export default router;
