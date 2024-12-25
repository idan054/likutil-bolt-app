export interface SuperOrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  image: string;
  orderIds: number[];
  slug: string;
  productId: number;
}