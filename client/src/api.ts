import axios from 'axios';

export type Customer = {
	name: string;
}

export type BillingInfo = {
	status: string;
}

export type Price = {
	formattedTotalPrice: string;
}

export type Order = {
	id: number;
	createdDate: string;
	fulfillmentStatus: string;
	billingInfo: BillingInfo;
	customer: Customer;
	itemQuantity: number;
	price: Price;
	additionalInfo: boolean;
	items: Item1[];
}

export type Item1 = {
	id: string;
	quantity: number;
	name: string;
	price: number;
	image: string;
}

export type Item = {
	id: string;
	name: string;
	price: number;
	image: string;
}

export type ApiClient = {
	getOrders: (pageCount: number) => Promise<Order[]>;
	getItem: (itemId: string) => Promise<Item>;
}

export const createApiClient = (): ApiClient => {
	return {
		getOrders: (pageCount: number) => {
			return axios.get(`http://localhost:3232/api/orders?page=${pageCount}`).then((res) => res.data);
		},
		getItem: (itemId: string) => {
			return axios.get(`http://localhost:3232/api/items/${itemId}`).then((res) => res.data);
		}
	}
};



