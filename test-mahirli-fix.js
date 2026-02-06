
// Removed import, using global fetch available in Node.js 18+

// Mock data based on the error log and standard structure
const userId = "laxeZTunYlgyCiO5flcItzBDfGX2";
const provider = "mahirLi";
const keys = "c_key_3694a9a7-6993-4d4a-8016-cedf0759f9eb";
const baseUrl = "https://api.likutil.co.il";

const payloadWithoutDeliveryType = {
    pack_num: "1",
    // delivery_type: "client", // REMOVED THIS LINE
    id: "123456", // Mock Order ID
    number: "123456",
    date_created: "2026-02-06", // Format: YYYY-MM-DD
    customer_note: "Test API Fix",
    shipping: {
        first_name: "Test",
        last_name: "User",
        address_1: "Test Address 1",
        address_2: "",
        city: "Tel Aviv"
    },
    billing: {
        email: "test@example.com",
        phone: "0500000000"
    },
    business: {
        address: "Test Address 1",
        city: "Tel Aviv",
        name: "Test User"
    }
};

const url = `${baseUrl}/api/create-delivery?userId=${userId}&provider=${provider}&keys=${keys}`;

console.log("Testing with URL:", url);
// console.log("Payload:", JSON.stringify(payloadWithoutDeliveryType, null, 2));

async function runTest() {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payloadWithoutDeliveryType)
        });
        
        console.log("Response Status:", res.status, res.statusText);
        const text = await res.text();
        console.log("Response Body:", text);
    } catch (err) {
        console.error("Error:", err);
    }
}

runTest();
