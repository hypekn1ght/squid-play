import axios from "axios";

// Function to make Axios GET requests
const makeGetRequest = async (rpc: string) => {
    try {
        const response = await axios.get(`${rpc}/status?`);
        console.log(`Success ✅ for ${rpc}`)
        // Handle the response data here
        //console.log(`Response for ${rpc}:`, response.data);
    } catch (error) {
        // Handle any errors that occur during the request
        console.error(`Error ❌ for ${rpc}`);
    }
};

// Loop through the array of API endpoints and make GET requests
async function loopAndRequest() {
    const chains = await axios.get("http://api.squidrouter.com/v1/chains");
    for (const chain of chains.data.chains) {
        if (chain.chainType == "cosmos") {
            await makeGetRequest(chain.rpc);
        }
    }
}

loopAndRequest();