import { Router } from 'express';
import { ConcertController } from '../controllers/concert.controller';

const router = Router();
const concertController = new ConcertController();

/**
 * @swagger
 * /api/concerts:
 *   get:
 *     summary: Get all concerts
 *     tags: [Concerts]
 *     responses:
 *       200:
 *         description: List of concerts
 */
router.get('/', (req, res) => concertController.getAll(req, res));

/**
 * @swagger
 * /api/concerts/{id}:
 *   get:
 *     summary: Get concert details by ID including ticket categories
 *     tags: [Concerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Concert details
 *       404:
 *         description: Concert not found
 */
router.get('/:id', (req, res) => concertController.getById(req, res));

export default router;
