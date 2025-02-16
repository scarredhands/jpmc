const express = require('express');
const app = express();
const PORT = 3000;

// Stock exchange setup
const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
const orderBook = { buy: {}, sell: {} };
const marketPrices = {};

// Initialize order books and market prices
stockSymbols.forEach(stock => {
    orderBook.buy[stock] = [];
    orderBook.sell[stock] = [];
    marketPrices[stock] = Math.floor(Math.random() * 50) + 100; // Initial stock price (random between 100-150)
});

// Trader class
class Trader {
    constructor(id, cash) {
        this.id = id;
        this.cash = cash;
        this.portfolio = {};
        this.active = true; // Indicates if the trader can continue trading

        stockSymbols.forEach(stock => {
            this.portfolio[stock] = Math.floor(Math.random() * 50) + 10; // Initial stocks (10-50)
        });
    }

    depositMoney() {
        const depositAmount = Math.floor(Math.random() * 30000) + 100000; // Deposit between $10k - $30k
        this.cash += depositAmount;
        process.stdout.write(`💰 Trader ${this.id} deposited $${depositAmount} and resumed trading!\n`);
        this.active = true;
    }

    placeOrder(type, stock) {
        if (!this.active) return; // Skip if trader is inactive

        let marketPrice = marketPrices[stock];
        let price;
        let bestBid = orderBook.buy[stock].length ? Math.max(...orderBook.buy[stock].map(o => o.price)) : marketPrice * 0.95;
        let bestAsk = orderBook.sell[stock].length ? Math.min(...orderBook.sell[stock].map(o => o.price)) : marketPrice * 1.05;
        let midPrice = (bestBid + bestAsk) / 2;
        
        let priceOptions = [bestBid, bestAsk, midPrice];
        if (orderBook.buy[stock].length === 0 && orderBook.sell[stock].length === 0) {
            price = marketPrices[stock] * (Math.random() > 0.5 ? 1.05 : 0.95);
        }
        else{
            price = priceOptions[Math.floor(Math.random() * priceOptions.length)];
        }
        
       
        
        if (type === 'buy') {
           
            if (this.cash >= price * 1000) {
                orderBook.buy[stock].push({ trader: this, price, quantity: 1000 });
                process.stdout.write(`✅ Trader ${this.id} placed BUY order for ${stock} at $${price.toFixed(2)}\n`);
            } else {
                process.stdout.write(`❌ Trader ${this.id} FAILED to place BUY order for ${stock} (Not enough cash)\n`);
            }
        } else if (type === 'sell') {
           
            if (this.portfolio[stock] >= 1000) {
                orderBook.sell[stock].push({ trader: this, price, quantity: 1000 });
                process.stdout.write(`✅ Trader ${this.id} placed SELL order for ${stock} at $${price.toFixed(2)}\n`);
            } else {
                process.stdout.write(`❌ Trader ${this.id} FAILED to place SELL order for ${stock} (Not enough stocks)\n`);
            }
        }

        // Check if the trader is completely out of cash and stocks
        if (this.cash < 1000 && Object.values(this.portfolio).every(stock => stock < 1000)) {
            if (Math.random() < 0.5) {
                this.depositMoney(); // 50% chance to deposit money
            } else {
                this.active = false;
                process.stdout.write(`🛑 Trader ${this.id} has stopped trading (No cash/stocks left)\n`);
            }
        }
    }
}

// Create traders
const traders = Array.from({ length: 5 }, (_, i) => new Trader(i + 1, Math.floor(Math.random() * 50000) + 500000));

// Order matching function
function matchOrders(stock) {
    const buyOrders = orderBook.buy[stock].sort((a, b) => b.price - a.price);
    const sellOrders = orderBook.sell[stock].sort((a, b) => a.price - b.price);

    while (buyOrders.length > 0 && sellOrders.length > 0) {
        let buyOrder = buyOrders[0];
        let sellOrder = sellOrders[0];

        if (buyOrder.price >= sellOrder.price) {
            let tradePrice = (buyOrder.price + sellOrder.price) / 2;
            buyOrder.trader.cash -= tradePrice * 1000;
            buyOrder.trader.portfolio[stock] += 1000;
            sellOrder.trader.cash += tradePrice * 1000;
            sellOrder.trader.portfolio[stock] -= 1000;

            process.stdout.write(`🔄 Trade executed: ${stock} at $${tradePrice.toFixed(2)} (Trader ${buyOrder.trader.id} ↔ Trader ${sellOrder.trader.id})\n`);

            // Update market price
            marketPrices[stock] = tradePrice;

            buyOrders.shift();
            sellOrders.shift();
        } else {
            break;
        }
    }

    // Remove matched orders from the order book
    orderBook.buy[stock] = buyOrders;
    orderBook.sell[stock] = sellOrders;
}

// Simulate trading day using `setInterval()`
function simulateTradingDay() {
    const tradingSeconds = 30;
    let currentSecond = 0;

    let interval = setInterval(() => {
        if (currentSecond >= tradingSeconds) {
            clearInterval(interval);
            process.stdout.write("\n✅ Trading day simulation complete.\n");

            traders.forEach(trader => {
                let portfolioValue = stockSymbols.reduce((sum, stock) => sum + trader.portfolio[stock] * marketPrices[stock], trader.cash);
                process.stdout.write(`📊 Trader ${trader.id} Final Portfolio Value: $${portfolioValue.toFixed(2)}\n`);
            });

            return;
        }

        traders.forEach(trader => {
            let stock = stockSymbols[Math.floor(Math.random() * stockSymbols.length)];
            let action = Math.random() > 0.5 ? 'buy' : 'sell';
            trader.placeOrder(action, stock);
        });

        stockSymbols.forEach(stock => matchOrders(stock));

        currentSecond++;
    }, 500);
}

// Start the simulation
simulateTradingDay();

// Express server
app.get('/', (req, res) => {
    res.send('📈 Stock Exchange Simulation Backend is Running!');
});

app.listen(PORT, () => console.log(`🚀 Stock Exchange running on http://localhost:${PORT}`));

