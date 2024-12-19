async function getTotalPrice() {
    try {
        const response = await fetch(`${workerUrl}/getCollection`);
        const collection = await response.json();

        const totalPrice = collection.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            return sum + price;
        }, 0);

        updateTotalPrice(totalPrice);
    } catch (error) {
        console.error('Error fetching collection:', error);
    }
}

function updateTotalPrice(totalPrice) {
    const totalPriceElement = document.getElementById("total-price");
    if (totalPriceElement) {
        totalPriceElement.textContent = `Total Price: $${totalPrice.toFixed(2)}`;
    } else {
        console.warn('Total price element not found.');
    }
}
