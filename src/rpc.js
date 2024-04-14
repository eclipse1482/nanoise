import axios from 'axios'
import { block } from 'nanocurrency-web'
import { readConfig } from './config.js';
import { tools } from 'nanocurrency-web';

export async function getAccountBalances(addresses) {
    try {
        // Read configuration from config.json
        const { rpcUrl } = readConfig();

        // Make the first call
        const response = await axios.post(rpcUrl, {
            action: 'accounts_balances',
            accounts: addresses,
        });

        return response.data.balances
        
    } catch (error) {
        console.error('Error in rpc.js getAccountsBalances:', error);
        throw error;
    }
}

/*
export async function getAccountBalances(addresses) {
    try {
        // Read configuration from config.json
        const { rpcUrl } = readConfig();

        let response1, response2, response3;
        // Make the first call
        response1 = await axios.post(rpcUrl, {
            action: 'accounts_balances',
            accounts: addresses,
        });

        //console.log("TEST - RPC getAccountBalances Response1: ",response1.status,response1.data)

        const keys1 = Object.keys(response1.data.balances);
        //console.log("TEST - Response1 from getAccountBalances RPC call: ", keys1.length)

        // Add a delay of 10 seconds before making the second call
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Make the second call
        response2 = await axios.post(rpcUrl, {
            action: 'accounts_balances',
            accounts: addresses,
        });

        const keys2 = Object.keys(response2.data.balances);
        //console.log("TEST - Response2 from getAccountBalances RPC call: ", keys2.length)

        // Add a delay of 10 seconds before making the third call
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Make the third call
        response3 = await axios.post(rpcUrl, {
            action: 'accounts_balances',
            accounts: addresses,
        });

        const keys3 = Object.keys(response3.data.balances);
        //console.log("TEST - Response3 from getAccountBalances RPC call: ", keys3.length)

        // Check for the max length and use that response.
        if (keys1.length >= Math.max(keys2.length,keys3.length)){
            return response1.data.balances;
        } else if (keys2.length >= Math.max(keys1.length,keys3.length)){
            return response2.data.balances;
        } else {
            return response3.data.balances;
        }
    } catch (error) {
        console.error('Error in rpc.js getAccountsBalances:', error);
        throw error;
    }
}
*/

export async function getAccountRepresentative(blockHash){
    try {
    // Read configuration from config.json
    const { rpcUrl } = readConfig();
    
    const response = await axios.post(rpcUrl, {
        "action": "block_info",
        "hash": blockHash
      })

      return response.data.contents.representative

    } catch(error) {
        console.error("Error retreiving representative information: ",error);
        throw error;
    }

}

/*
// Function to get account representative
export async function getAccountRepresentative(accountAddress) {  
    try {
        const response = await axios.post('https://node.somenano.com/proxy', {
            "action": "account_representative",
            "account": fromAddress,
        });
        return response.data.representative;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
*/

// Function to get account info
export async function getAccountInfo(accountAddress) {
    try {
        // Read configuration from config.json
        const { rpcUrl } = readConfig();

        // Make RPC call to get account info
        const response = await axios.post(rpcUrl, {
            "action": "account_info",
            "account": accountAddress
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching account info:', error);
        throw error;
    }
}

export async function getReceivables(address) {
    try {
        // Read configuration from config.json
        const { rpcUrl } = readConfig();

        // Make RPC call to get account info
        const response = await axios.post(rpcUrl, {
            "action": "receivable",
            "account": address,
            //"count": "5",
            "array": "true"
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching receivable transactions:', error);
        throw error;
    }

}

async function generateWork(hash, difficulty) {
    // Read configuration from config.json
    const { rpcUrl, apiKey } = readConfig();

    const response = await axios.post(rpcUrl, {
        "action": "work_generate",
        "hash": hash,
        "difficulty": difficulty,
        "key": apiKey
    });
    
    const work = response.data.work;

    return work;
    
}

// Function to createSendBlock
export async function createSendBlock(privateKey, fromAddress, toAddress, amountNano) {
    // Calculate amount in raw units (raw is the base unit for Nano)
    const amountRaw = tools.convert(amountNano,"NANO","RAW");
    const type = 'send';
    const { workSendBlockDifficulty } = readConfig();

    try {         
        // Get account info to obtain current wallet balance and previous block
        const sendAccountInfo = await getAccountInfo(fromAddress);
        const currentWalletBalanceRaw = sendAccountInfo.balance;
        const previousSendBlockHash = sendAccountInfo.frontier;

        // Get the representative address for the fromAddress
        const representativeAddress = await getAccountRepresentative(previousSendBlockHash);
        
        // Generate work for the send and receive blocks
        const work = await generateWork(previousSendBlockHash, workSendBlockDifficulty);

        // Create a send Block data object
        const data = {
            walletBalanceRaw: currentWalletBalanceRaw,
            fromAddress: fromAddress,
            toAddress: toAddress,
            representativeAddress: representativeAddress,
            frontier: previousSendBlockHash,
            amountRaw: amountRaw.toString(),
            work: work
        };

        // Sign the block
        const signedSendBlock = block.send(data, privateKey);
        //console.log('Signed send block: ',signedSendBlock);

        // Return the signed block
        return signedSendBlock;
    } catch (error) {
        console.error('Error signing send block:', error);
        throw error;
    }
}

// Create a receive block
export async function createReceiveBlock(privateKey, toAddress, amountNano, sendBlockHash, receiverPublicKey) {
    // Calculate amount in raw units (raw is the base unit for Nano)
    const amountRaw = tools.convert(amountNano, "NANO", "RAW");
    const { workReceiveBlockDifficulty } = readConfig();

    try {      
        // Get the representative address from the sendBlock
        const representativeAddress = await getAccountRepresentative(sendBlockHash);

        // Get account info to obtain current wallet balance and previous block
        const accountInfo = await getAccountInfo(toAddress);
        const previousBlock = accountInfo.frontier;
        const currentWalletBalanceRaw = accountInfo.balance;
        //console.log("TEST - RPC Create Receive Block, currentWalletBalanceRaw: ",currentWalletBalanceRaw);

        let genesisBlock, work;
        if (accountInfo.error && accountInfo.error === "Account not found") {
            genesisBlock = true;
            // Generate Work
            work = await generateWork(receiverPublicKey, workReceiveBlockDifficulty);
        } else {
            genesisBlock = false;
            // Generate Work
            work = await generateWork(previousBlock, workReceiveBlockDifficulty);
        }
        
        // Create a receive Block data object
        let data;
        if(genesisBlock === true){
            data = {
                walletBalanceRaw: currentWalletBalanceRaw,
                toAddress: toAddress,
                representativeAddress: representativeAddress,
                frontier: '0'.padStart(64,'0'),
                transactionHash: sendBlockHash, //hash.hash,
                amountRaw: amountRaw.toString(),
                work: work
            };
        }else{
            data = {
                walletBalanceRaw: currentWalletBalanceRaw,
                toAddress: toAddress,
                representativeAddress: representativeAddress,
                frontier: previousBlock,
                transactionHash: sendBlockHash, //hash.hash,
                amountRaw: amountRaw.toString(),
                work: work
            };
        }
        
        
        // Sign the block
        const signedReceiveBlock = block.receive(data, privateKey);
        //console.log(signedReceiveBlock);
        
        // Return the signed block
        return signedReceiveBlock;
    } catch (error) {
        console.error('Error signing receive block:', error);
        throw error;
    }
}

export async function processBlock(type, signedBlock) {
    try {
        // Read configuration from config.json
        const { rpcUrl } = readConfig();

        // Make RPC call to process the signed block
        const response = await axios.post(rpcUrl, {
            "action": "process",
            "json_block": "true",
            "subtype": type,
            "block": signedBlock // pass signed block as part of the request body
        });

        // Log the response data from processing the block
        console.log("Block hash: ",response.data.hash);

        // Return the response data
        return response.data.hash;
    } catch (error) {
        console.error('Error processing signed block:', error);
        throw error;
    }
}
