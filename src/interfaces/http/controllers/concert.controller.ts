import { Request, Response } from 'express';
import { ConcertRepository } from '../../../infrastructure/repositories/concert.repository.impl';

export class ConcertController {
  private concertRepo: ConcertRepository;

  constructor() {
    this.concertRepo = new ConcertRepository();
  }

  async getAll(req: Request, res: Response) {
    try {
      const concerts = await this.concertRepo.findAll();
      return res.json(concerts);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const concert = await this.concertRepo.findById(parseInt(req.params.id as string));
      if (!concert) return res.status(404).json({ message: 'Concert not found' });
      return res.json(concert);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}
