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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 *       409:
 *         description: Conflict (Out of stock or concurrency issue)
 *       400:
 *         description: Bad Request
 */
router.post('/', (req, res) => orderController.create(req, res));

export default router;
