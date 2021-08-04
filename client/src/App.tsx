import React from 'react';
import './App.scss';
import {createApiClient, Order} from './api';
import 'bootstrap/dist/css/bootstrap.min.css'
import {Button, Form} from 'react-bootstrap'



export type AppState = {
	orders?: Order[],
	search: string,
	pageCounter: number,
	searchByItem: boolean,
	NotDeliv: boolean
}

const api = createApiClient();

export class App extends React.PureComponent<{}, AppState> {

	state: AppState = {
		search: '',
		pageCounter: 1,
		searchByItem: false,
		NotDeliv: false,
	};

	pageIncrement = () => this.setState((state) => ({...state, pageCounter: state.pageCounter + 1}))
	
	searchDebounce: any = null;

	async componentDidMount() {
		this.setState({
			orders: await api.getOrders(this.state.pageCounter)
			.then((res) => res.map((order: Order) => this.InitAdditionalInfo(order)))
		});
		this.pageIncrement()
	}

	InitAdditionalInfo = (order: Order): Order =>{
		order.additionalInfo = false
		order.items.map((item) => api.getItem(item.id).then((res) => {
			item.image = res.image
			item.name = res.name
			item.price = res.price
			this.setState((state) => ({...state}))
		}))
		return order
	}

	onSearch = async (value: string, newPage?: number) => {

		clearTimeout(this.searchDebounce);

		this.searchDebounce = setTimeout(async () => {
			this.setState({
				search: value
			});
		}, 300);
	};

	render() {
		const {orders} = this.state;
		return (
			<main>
				<h1>Orders</h1>
				<header>
					<input type="search" placeholder="Search" onChange={(e) => this.onSearch(e.target.value)}/>
					<h4>Filters:</h4>
					<Form.Check label='Item name' inline onClick={() => this.changeSearchType()}></Form.Check>
					<Form.Check label='Not delievered orders' inline onClick={() => this.changeSearchType2()}></Form.Check>
				</header>
				{orders ? <div className='results'>Showing {this.filterOrders(this.filterNotDeliv(orders, this.state.NotDeliv), this.state.searchByItem).length} results</div> : null}
				{orders ? this.renderOrders(orders) : <h2>Loading...</h2>}
				<Button className="btn"
						onClick={() => this.ShowMore()}>
					Show more orders... </Button>
			</main>
		)
	}

	changeSearchType = () => this.setState((state) => ({...state, searchByItem: !state.searchByItem}))
	changeSearchType2 = () => this.setState((state) => ({...state, NotDeliv: !state.NotDeliv}))

	async ShowMore() {
		this.pageIncrement()
		this.setState({
			orders: this.state.orders?.concat(await api.getOrders(this.state.pageCounter)
			.then((res) => res.map((order: Order) => this.InitAdditionalInfo(order))))
		});
	}

	filterOrders = (ordersToFilt: Order[], pred: boolean): Order[] =>
		!pred ? ordersToFilt
		.filter((order: Order) => (order.customer.name.toLowerCase() + order.id).includes(this.state.search.toLowerCase())) :
			ordersToFilt.filter((order: Order) =>
				order.items.map((item) => item.name.toLowerCase().includes(this.state.search.toLowerCase())).includes(true))
	

	filterNotDeliv = (ordersToFilt: Order[], pred: boolean): Order[] =>
		!pred ? ordersToFilt :
			ordersToFilt.filter((order: Order) => 
				order.fulfillmentStatus === 'not-fulfilled')

				
	renderOrders = (orders: Order[]) => {
		const filteredOrders : Order[] = this.filterOrders(this.filterNotDeliv(orders, this.state.NotDeliv), this.state.searchByItem)
		
		return (
			<div className='orders'>
				{filteredOrders.map((order) => (
					<div className={`orderCard ${order.additionalInfo ? 'info' : ''}`}
						 onDoubleClick={() => this.openAdditionalInfo(orders, order.id)}
						 key = {order.id}>
						

						<div className={'generalData'}>
							<h6>{order.id}</h6>
							<h4>{order.customer.name}</h4>
							<h5>Order Placed: {new Date(order.createdDate).toLocaleDateString()}</h5>
						</div>
						<div className={'fulfillmentData'}>
							<h4>{order.itemQuantity} Items</h4>
							<img src={App.getAssetByStatus(order.fulfillmentStatus)}/>
							{order.fulfillmentStatus !== 'canceled' &&
								<a onClick={()=> this.onMark(orders, order.fulfillmentStatus, order.id)}>
									Mark as {order.fulfillmentStatus === 'fulfilled' ? 'Not Delivered' : 'Delivered'}
									</a>
							}
						</div>
						<div className={'paymentData'}>
							<h4>{order.price.formattedTotalPrice}</h4>
							<img src={App.getAssetByStatus(order.billingInfo.status)}/>
							<h6>*Double click for additional info</h6>
						</div>
						{ order.additionalInfo &&
						<div className={'addedInfo'}>
							<h4 style={{ color: 'black' }}>Order info:</h4>
							<h5>Names and quantity:</h5> 
							<h6>{order.items.map((item) => <p key={item.id}>{item.name+' - '+item.quantity}</p>)}</h6>
							<h5><p>Picture of highest price item:</p></h5>
							<img src={order.items[this.findHighestPrice(order)].image} width='50' height='50' />
							<h5>Excect time of order:</h5>
							<h6>{order.createdDate.split('T',).join(' - ').split('Z')}</h6>
						</div>}
						

					</div>
				))}
			</div> 
		)
	};

	findHighestPrice = (order: Order): number => {
		const prices = order.items.map((item) => item.price)
		return prices.indexOf(Math.max(...prices))
	}

	GetItemNames = (order: Order): string[] => { 
		const a: string[] = [];
		order.items.map((item) => api.getItem(item.id).then((res)=>{ 
			setTimeout(()=>console.log('waiting'),200)
			a.concat(res.name)}))
		console.log(a)
		setTimeout(()=>console.log('waiting'),200)
		return a;
	}

	openAdditionalInfo = (orders: Order[], id: number) => {
		this.setState({
			orders: orders.map((order: Order) => 
				order.id === id ? this.onClickInfo(order) : order)
		})
	}

	onClickInfo = (order: Order): Order => {
		order.additionalInfo = !order.additionalInfo
		return order
	}

	onMark = (orders: Order[], status: string, id: number) => {
		status === 'not-fulfilled' ? this.setState({
			orders: orders.map((order : Order) => 
				order.id === id ? this.setFulfillmentStatus(order, 'fulfilled') : order)
		}) : this.setState({
			orders: orders.map((order : Order) => 
				order.id === id ? this.setFulfillmentStatus(order, 'not-fulfilled') : order)
		})
		
	}

	setFulfillmentStatus = (order : Order, newStatus : string) : Order => {
		order.fulfillmentStatus = newStatus;
		return order
	}

	static getAssetByStatus(status: string) {
		switch (status) {
			case 'fulfilled':
				return require('./assets/package.png');
			case 'not-fulfilled':
				return require('./assets/pending.png');
			case 'canceled':
				return require('./assets/cancel.png');
			case 'paid':
				return require('./assets/paid.png');
			case 'not-paid':
				return require('./assets/not-paid.png');
			case 'refunded':
				return require('./assets/refunded.png');
		}
	}
}

export default App;
