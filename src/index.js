import { wallet } from 'nanocurrency-web'
import { encryptWallet, decryptWallet, saveEncryptedWallet, generateEncryptionKey, encryptData, decryptData, doesWalletExist, generateTransactionDelay, masterAccountProbability, logNormal } from './utils.js';
import { createSendBlock, processBlock, getReceivables, createReceiveBlock, getAccountBalances} from './rpc.js';
import { readConfig } from './config.js';
import fs from 'fs';
import path from 'path';
import prompts from 'prompts';

// Initialization Function
async function init(){
  
  // Prompt questions for new wallet
  const newWalletPrompt = [
    {
        type: 'password',
        name: 'mnemonicPhrase',
        message: 'Enter your 24-word mnemonic phrase:',
        validate: value => value.split(' ').length === 24 || 'Mnemonic phrase must contain exactly 24 words.'
    },
    {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
        validate: value => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/.test(value) || 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    },
    {
        type: 'number',
        name: 'endIndex',
        message: 'Enter the index where you want to end:',
        validate: value => Number.isInteger(value) || 'Please enter a valid integer.'
    },
    {
        type: 'number',
        name: 'targetBalance',
        message: 'Enter your target balance:',
        validate: value => !isNaN(value) && value >= 0 || 'Please enter a valid non-negative number.'
    },
    {
        type: 'select',
        name: 'delayFrequency',
        message: 'What frequency would you like shuffling transactions to run in your Master address?',
        choices: [
            { title: 'Seconds', value: 's' },
            { title: 'Minutes', value: 'm' },
            { title: 'Hours', value: 'h' },
            { title: 'Days', value: 'd' },
            { title: 'Weeks', value: 'w' }
        ]
    }
  ];
  
  // Prompt questions for existing wallet
  const existingWalletPrompt = [
    {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
        validate: value => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/.test(value) || 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    },
    {
        type: 'number',
        name: 'targetBalance',
        message: 'Enter your target balance:',
        validate: value => !isNaN(value) && value >= 0 || 'Please enter a valid non-negative number.'
    },
    {
        type: 'select',
        name: 'delayFrequency',
        message: 'What frequency would you like mixing transactions to run?',
        choices: [
            { title: 'Seconds', value: 's' },
            { title: 'Minutes', value: 'm' },
            { title: 'Hours', value: 'h' },
            { title: 'Days', value: 'd' },
            { title: 'Weeks', value: 'w' }
        ]
    }
  ];
  
  try {
    // Initialize some variables
    const startIndex = 0;

    // Check if wallet directory exists
    const hiddenDirPath = path.join(process.env.HOME, '.nanoise');
    if (!fs.existsSync(hiddenDirPath)) {
        fs.mkdirSync(hiddenDirPath);
    }

    // Construct wallet file path
    const walletFilePath = path.join(hiddenDirPath, 'wallet');

    // Check if wallet file exists
    const walletExists = doesWalletExist(walletFilePath);

    let answers;
    let encryptedWallet;
    let decryptedWallet;
    let allAccounts;
    let endIndex;

    if (walletExists) {
      console.log('Wallet exists');
      // Wallet exists
      const importWalletPrompt = {
          type: 'select',
          name: 'importWallet',
          message: 'A wallet already exists. Do you want to import it or overwrite it with a new mnemonic phrase?',
          choices: [
              { title: 'Import existing wallet', value: 'import' },
              { title: 'Overwrite with new mnemonic phrase', value: 'overwrite' }
          ]
      };
  
      const importChoice = await prompts(importWalletPrompt);
      console.log('User choice:', importChoice);
      if (importChoice.importWallet === 'import') {
          console.log('Importing existing wallet');
          // Import existing wallet, prompt for existing wallet details
          answers = await prompts(existingWalletPrompt);
  
          // Decrypt existing wallet data
          const password = answers.password;
          console.log('Decrypting existing wallet');
          encryptedWallet = JSON.parse(fs.readFileSync(walletFilePath, 'utf8'));
          try{
            decryptedWallet = decryptWallet(encryptedWallet, password);
            allAccounts = JSON.parse(decryptedWallet || []);
            endIndex = allAccounts.length - 1;
            console.log('Existing Wallet Decrypted Successfully');
          } catch(error){
              console.log("Unable to decrypt. Please try your password again or overwrite wallet with mnemonic phrase.")
          }
      } else {
          console.log('Overwriting existing wallet');
          // Overwrite with new mnemonic phrase
          answers = await prompts(newWalletPrompt); // Use newWalletPrompt here
          
          // Get wallet information from the provided mnemonic phrase
          const { mnemonicPhrase, password } = answers;
          endIndex = answers.endIndex;
          allAccounts = getWalletInfo(mnemonicPhrase, startIndex, endIndex);
          
          // Encrypt the new wallet data with the new password
          encryptedWallet = encryptWallet(JSON.stringify(allAccounts), password);
          console.log('New wallet encrypted successfully');
          
          // Save encrypted data to file, overwriting the existing wallet
          saveEncryptedWallet(encryptedWallet, walletFilePath);
          console.log('Encrypted data saved to:', walletFilePath);
      }
    } else {
        console.log('Wallet does not exist');
        // Wallet doesn't exist, prompt for new wallet details
        answers = await prompts(newWalletPrompt);
        
        // Get wallet information from the provided mnemonic phrase
        const { mnemonicPhrase } = answers;
        endIndex = answers.endIndex;
        allAccounts = getWalletInfo(mnemonicPhrase, startIndex, endIndex);
    }
  
    
    generateEncryptionKey();
    const encryptedAllAccounts = encryptData(JSON.stringify(allAccounts));
    

    // Access the answers that were not defined above
    const { password, targetBalance, delayFrequency } = answers;

    // Encrypt allAccounts using PBKDF2 and AES if it's a new wallet or if the user chose to overwrite the existing wallet
    if (!walletExists || (walletExists && answers.importWallet === 'overwrite')) {
        encryptedWallet = encryptWallet(JSON.stringify(allAccounts), password);
        console.log('Wallet encrypted successfully');

        // Save encrypted data to file
        saveEncryptedWallet(encryptedWallet, walletFilePath);
        console.log('Encrypted data saved to:', walletFilePath);
    }

    return { encryptedAllAccounts, startIndex, endIndex, delayFrequency, targetBalance }

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function makeSomeNoise( encryptedAllAccounts, startIndex, endIndex, delayFrequency, targetBalance ) {
  console.log("_______________________________________________");
  
  try{    
    // Calculate delay between mixes such that each account recieves a transaction in seconds, minutes, hours, days, or weeks
    const mixDelay = generateTransactionDelay(delayFrequency) / endIndex;

    // Decrypt allAccounts
    const decryptedAllAccounts = decryptData(encryptedAllAccounts);
    const allAccounts = JSON.parse(decryptedAllAccounts || []);
      
    // Return allAddresses used in the mixer so I can get account balances
    const allAddresses = allAccounts.map(item => item.address);
    //console.log("TEST - allAddresses: ",allAddresses);

    // Return allAccountBalances and all accountsWithBalance
    const {allAccountBalances, indicesWithBalance, totalAccountsWithBalance } = await getAccountBalanceArrays(allAddresses) 
    //console.log("All Accounts: ", allAccountBalances);
    //console.log("Accounts with Balances: ", accountsWithBalance);
    // Determine senderIndex
    const senderIndex = await getSenderIndex(allAccountBalances[startIndex].balance_nano, targetBalance, endIndex, indicesWithBalance, totalAccountsWithBalance);
    console.log("Sender Index: ", senderIndex);

    // Determine receiverIndex
    const receiverIndex = await getReceiverIndex(allAccountBalances[startIndex].balance_nano, targetBalance, endIndex, totalAccountsWithBalance, senderIndex);
    console.log("Receiver Index: ", receiverIndex);

    // Select random transaction amount
    // Read configuration from config.json
    const { txAmountMean, txAmountStdDev } = readConfig();
    const transactionPercent = logNormal(txAmountMean, txAmountStdDev);
    const amountNano = transactionPercent * allAccountBalances[senderIndex].balance_nano;
    //console.log("Sender Balance: ", allAccountBalances[senderIndex].balance_nano);
    //console.log("Transaction Percent: ", transactionPercent);
    //console.log("Single Transaction Amount: ", amountNano);

    // Send a block
    let senderPrivateKey, receiverPrivateKey;
    senderPrivateKey = allAccounts[senderIndex].privateKey; 
    receiverPrivateKey = allAccounts[receiverIndex].privateKey;
    const receiverPublicKey = allAccounts[receiverIndex].publicKey;
    const fromAddress = allAccounts[senderIndex].address;
    const toAddress = allAccounts[receiverIndex].address;

    console.log("From: ",fromAddress);
    console.log("To: ",toAddress);
    console.log("Amount: ",amountNano);

    // Send a send block
    //const { sendBlockHash, receiveWork } = await sendBlock(senderPrivateKey, fromAddress, toAddress, amountNano, receiverPublicKey)
    await sendBlock(senderPrivateKey, fromAddress, toAddress, amountNano);

    // Add a 10-second delay
    const getReceivablesDelay = Math.random()*10000+1000;
    await new Promise(resolve => setTimeout(resolve, getReceivablesDelay));

    // Get receivable transactions
    let receivables = await getReceivables(toAddress);
    
    // Send a receive block for each receivable
    if (!Array.isArray(receivables)) {
      // Convert single object into an array with one element
      receivables = [receivables];
    }
    
    for( const transaction of receivables ){
      const sendBlockHash = transaction.hash;
      const amountNano = transaction.amount_nano;

      await receiveBlock(receiverPrivateKey, toAddress, amountNano, sendBlockHash, receiverPublicKey);
    }

    return mixDelay
  } catch(error){
    console.log("Error: ",error);
  }
}

function getWalletInfo(phrase, startIndex, endIndex) {
  // Import a wallet with a seed
  const seedWallet = wallet.fromLegacyMnemonic(phrase);

  // Derive private keys for a seed
  const allAccounts = wallet.legacyAccounts(seedWallet.seed, startIndex, endIndex);

  return allAccounts;
}

// <- Main Functions ->
async function getAccountBalanceArrays(allAddresses) {
  //console.log("TEST - getAccountBalanceArrays, allAddresses: ", allAddresses);
  try{
    const result = await getAccountBalances(allAddresses);
    //console.log("TEST - Log result from getAccountBalances: ",result);
    //console.log("TEST - length from getAccountBalances: ", result.length);
    
    // Map over the result array and add index to each item
    const allAccountBalances = Object.keys(result).map((address, index) => {
      return { index, address, ...result[address] };
    });
    //console.log("TEST - Log result for allAccountBalances after index is added to array: ", allAccountBalances);
    //console.log("TEST - allAccountBalances Length: ", allAccountBalances.length);

    // Filter allAccountBalances to show only accountsWithBalance
    const accountsWithBalance = allAccountBalances.filter(item => parseFloat(item.balance) > 0);
    //console.log("TEST - Log result from accountsWithBalance (after allAccountBalances is filtered): ", accountsWithBalance);
    //console.log("TEST - accountsWithBalance Length: ", accountsWithBalance.length);
    
    const totalBalance = accountsWithBalance.reduce((total, balance) => total + parseFloat(balance.balance_nano), 0);
    
    const accountsWithReceivable = allAccountBalances.filter(item => parseFloat(item.receivable_nano) > 0);
    const receivableBalance = accountsWithReceivable.reduce((total,receivable) => total + parseFloat(receivable.receivable_nano),0);
    const indicesWithBalance = accountsWithBalance.map(index => index.index);
    const indicesWithReceivable = accountsWithReceivable.map(index => index.index);
    const totalAccountsWithBalance = indicesWithBalance.length;

    console.log("Total Receivable: ", receivableBalance.toFixed(9));
    console.log("Account Indexes with Receivables: ", indicesWithReceivable);
    console.log("Master Account Balance: ", accountsWithBalance[0].balance_nano);
    console.log("Total Balance: ", totalBalance.toFixed(9)); 
    console.log("Total Number of Accounts with Balance: ",totalAccountsWithBalance);
    console.log("Account Indexes with Balance: ",indicesWithBalance);
    
    return {allAccountBalances, indicesWithBalance, totalAccountsWithBalance }; // Return the processed array
  }
  catch (error) {
  console.error('Error in getAccountBalanceArrays:', error);
  throw error; // Throw the error to be caught by the caller
  }
}
                              
async function getSenderIndex(masterBalance, targetBalance, endIndex, indicesWithBalance, totalAccountsWithBalance){
  // Calculate sending probability for master account
  const sendingProbabilityMaster = masterAccountProbability(masterBalance, targetBalance, endIndex, totalAccountsWithBalance, true);
  //console.log("TEST - sendingProbabilityMaster (should match probability): ",sendingProbabilityMaster);
  // Randomly generate a number between 0 and 1
  const randomSending = Math.random();
  //console.log("TEST - randomSending (if less than sendingProbabilityMaster, index 0 is selected): ", randomSending)
  let senderIndex = 0;
  if (randomSending < sendingProbabilityMaster) {
      senderIndex = 0; // Master account
  } else {
      // Select from decoy accounts
      const decoyAccounts = indicesWithBalance//Array.from({ length: endIndex }, (_, i) => i + 1); // Indexes 1 to 100
      //senderIndex = decoyAccounts[Math.floor(Math.random() * decoyAccounts.length)];
      // This snippet is used if I need to remove index 0 from selection
      while (senderIndex === 0){
        senderIndex = decoyAccounts[Math.floor(Math.random() * decoyAccounts.length)];
      }
  }

  return senderIndex;
}

async function getReceiverIndex(masterBalance, targetBalance, endIndex, totalAccountsWithBalance, senderIndex){
  // Calculate receiving probability for master account
const receivingProbabilityMaster = masterAccountProbability(masterBalance, targetBalance, endIndex, totalAccountsWithBalance, false);

// Randomly generate a number between 0 and 1
const randomReceiving = Math.random();

let receiverIndex;
if (randomReceiving < receivingProbabilityMaster && senderIndex !== 0) {
    receiverIndex = 0; // Master account
} else {
    // Select from decoy accounts
    const decoyAccounts = Array.from({ length: endIndex }, (_, i ) => i +1 ); // Indexes 1 to 100
    
    receiverIndex = senderIndex;
    while (receiverIndex === senderIndex) { // Regenerate if receiverIndex equals senderIndex
      receiverIndex = decoyAccounts[Math.floor(Math.random() * decoyAccounts.length)];
    }
  }
return(receiverIndex);
}

async function sendBlock(privateKey, fromAddress, toAddress, amountNano, publicKey) {
  try {
   // Create a signed block
   const signedSendBlock = await createSendBlock(privateKey, fromAddress, toAddress, amountNano, publicKey);

   // Process the signed block
   const sendBlockHash = await processBlock('send', signedSendBlock);
  
   // Print date/time for execution start
   const currentDate = new Date().toLocaleString();
   console.log("Time Send Block Processed: ", currentDate);

   return sendBlockHash
 } catch (error) {
   // Handle errors
   console.error('Error:', error);

   // Return false indicating failure
   return false
 }
}

async function receiveBlock(privateKey, toAddress, amountNano, sendBlockHash, receiverPublicKey) {
  try {
   // Create a receive block
   const signedReceiveBlock = await createReceiveBlock(privateKey, toAddress, amountNano, sendBlockHash, receiverPublicKey);

   // Process the signed block
   await processBlock('receive', signedReceiveBlock);
   
   // Process the response data if needed
   //console.log(data);

   // Return true indicating success
   return true
 } catch (error) {
   // Handle errors
   console.error('Error:', error);

   // Return false indicating failure
   return false
 }
}

async function main(){
  // <- INIT ->
  try{
    const { encryptedAllAccounts, startIndex, endIndex, delayFrequency, targetBalance } = await init();
  
    console.log("Starting mixing process, please wait..")
  
    // <- TODO - BALANCES -> (I want to show top balances and maybe total budget and total receivables)

    // <- makeSomeNoise ->
    let noiseRequest = true;

    while (noiseRequest === true) {
      //console.log("TEST - MAIN While Loop encryptedAllAccounts: ",encryptedAllAccounts);
      const mixDelay = await makeSomeNoise( encryptedAllAccounts, startIndex, endIndex, delayFrequency, targetBalance );

      // Set timeout delay
      if (mixDelay === undefined) {
        noiseRequest = false; // Set noiseRequest to false if mixDelay is undefined so the loop exits
        console.log('Error in shuffling process. Exiting program.');
      } else {
        console.log(`Next transaction in ${mixDelay} seconds`);
        await new Promise(resolve => setTimeout(resolve, mixDelay * 1000));
      }
    }
  }catch (error) { // Finish the try block with an error catch
    console.error('Error:', error.message);
  }
}

// Initiate the program
main();