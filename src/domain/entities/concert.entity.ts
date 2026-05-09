export interface TicketCategory {
  id: number;
  concertId: number;
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  rowVersion?: Buffer;
}

export interface Concert {
  id: number;
  title: string;
  description: string;
  location: string;
  eventDate: Date;
  createdAt?: Date;
  categories?: TicketCategory[];
}
