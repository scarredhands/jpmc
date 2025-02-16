from flask import Flask
import random
import threading
import time

app = Flask(__name__)
PORT = 3000

# Stock exchange setup
stock_symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
order_book = {'buy': {}, 'sell': {}}
market_prices = {}

# Initialize order books and market prices
for stock in stock_symbols:
    order_book['buy'][stock] = []
    order_book['sell'][stock] = []
    market_prices[stock] = random.randint(100, 150)  # Initial stock price

class Trader:
    def __init__(self, trader_id, cash):
        self.trader_id = trader_id
        self.cash = cash
        self.portfolio = {stock: random.randint(10, 50) for stock in stock_symbols}
        self.active = True

    def deposit_money(self):
        deposit_amount = random.randint(10000, 30000)
        self.cash += deposit_amount
        print(f"💰 Trader {self.trader_id} deposited ${deposit_amount} and resumed trading!")
        self.active = True

    def place_order(self, order_type, stock):
        if not self.active:
            return

        market_price = market_prices[stock]
        best_bid = max([o['price'] for o in order_book['buy'][stock]], default=market_price * 0.95)
        best_ask = min([o['price'] for o in order_book['sell'][stock]], default=market_price * 1.05)
        mid_price = (best_bid + best_ask) / 2
        price_options = [best_bid, best_ask, mid_price]
        price = random.choice(price_options) if order_book['buy'][stock] or order_book['sell'][stock] else market_price * random.choice([1.05, 0.95])

        if order_type == 'buy':
            if self.cash >= price * 1000:
                order_book['buy'][stock].append({'trader': self, 'price': price, 'quantity': 1000})
                print(f"✅ Trader {self.trader_id} placed BUY order for {stock} at ${price:.2f}")
            else:
                print(f"❌ Trader {self.trader_id} FAILED to place BUY order for {stock} (Not enough cash)")
        elif order_type == 'sell':
            if self.portfolio[stock] >= 1000:
                order_book['sell'][stock].append({'trader': self, 'price': price, 'quantity': 1000})
                print(f"✅ Trader {self.trader_id} placed SELL order for {stock} at ${price:.2f}")
            else:
                print(f"❌ Trader {self.trader_id} FAILED to place SELL order for {stock} (Not enough stocks)")

        if self.cash < 1000 and all(v < 1000 for v in self.portfolio.values()):
            if random.random() < 0.5:
                self.deposit_money()
            else:
                self.active = False
                print(f"🛑 Trader {self.trader_id} has stopped trading (No cash/stocks left)")

traders = [Trader(i + 1, random.randint(50000, 500000)) for i in range(5)]

def match_orders(stock):
    buy_orders = sorted(order_book['buy'][stock], key=lambda x: x['price'], reverse=True)
    sell_orders = sorted(order_book['sell'][stock], key=lambda x: x['price'])

    while buy_orders and sell_orders:
        buy_order = buy_orders[0]
        sell_order = sell_orders[0]

        if buy_order['price'] >= sell_order['price']:
            trade_price = (buy_order['price'] + sell_order['price']) / 2
            buy_order['trader'].cash -= trade_price * 1000
            buy_order['trader'].portfolio[stock] += 1000
            sell_order['trader'].cash += trade_price * 1000
            sell_order['trader'].portfolio[stock] -= 1000
            print(f"🔄 Trade executed: {stock} at ${trade_price:.2f} (Trader {buy_order['trader'].trader_id} ↔ Trader {sell_order['trader'].trader_id})")
            market_prices[stock] = trade_price
            buy_orders.pop(0)
            sell_orders.pop(0)
        else:
            break

    order_book['buy'][stock] = buy_orders
    order_book['sell'][stock] = sell_orders

def simulate_trading_day():
    trading_seconds = 30
    for _ in range(trading_seconds):
        for trader in traders:
            stock = random.choice(stock_symbols)
            action = 'buy' if random.random() > 0.5 else 'sell'
            trader.place_order(action, stock)
        for stock in stock_symbols:
            match_orders(stock)
        time.sleep(0.5)
    print("\n✅ Trading day simulation complete.")
    for trader in traders:
        portfolio_value = sum(trader.portfolio[stock] * market_prices[stock] for stock in stock_symbols) + trader.cash
        print(f"📊 Trader {trader.trader_id} Final Portfolio Value: ${portfolio_value:.2f}")

@app.route('/')
def home():
    return "📈 Stock Exchange Simulation Backend is Running!"

def run_simulation():
    simulate_trading_day()

if __name__ == '__main__':
    threading.Thread(target=run_simulation).start()
    app.run(port=PORT)
