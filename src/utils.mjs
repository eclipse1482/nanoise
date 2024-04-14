import crypto from 'crypto';
import { readConfig } from './config.mjs';
import fs from 'fs';

// Encrypt data using PBKDF2 and AES
export function encryptWallet(data, password) {
    const salt = crypto.randomBytes(16); // Generate random salt
    const key = crypto.pbkdf2Sync(password, salt, 4000000, 32, 'sha512'); // Derive key from password using PBKDF2
    const iv = crypto.randomBytes(16); // Generate random IV (Initialization Vector)

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv); // Create AES cipher
    let encryptedData = cipher.update(data, 'utf8', 'hex'); // Encrypt data
    encryptedData += cipher.final('hex');

    return {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        encryptedData: encryptedData
    };
}

// Decrypt data using PBKDF2 and AES
export function decryptWallet(encryptedData, password) {
    const key = crypto.pbkdf2Sync(password, Buffer.from(encryptedData.salt, 'hex'), 4000000, 32, 'sha512'); // Derive key from password using PBKDF2
    const iv = Buffer.from(encryptedData.iv, 'hex'); // Convert IV from hex string to Buffer

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); // Create AES decipher
    let decryptedData = decipher.update(encryptedData.encryptedData, 'hex', 'utf8'); // Decrypt data
    decryptedData += decipher.final('utf8');

    return decryptedData;
}

// Save encrypted wallet to file
export function saveEncryptedWallet(data, filename) {
    fs.writeFileSync(filename, JSON.stringify(data), 'utf8');
}

// Check if wallet file exists
export function doesWalletExist(walletFilePath) {
    return fs.existsSync(walletFilePath);
}

export function generateEncryptionKey() {
    const keyLength = 32; // Key length in bytes (256 bits)
    const ENCRYPTION_KEY = crypto.randomBytes(keyLength).toString('hex');
    process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;
}

export function encryptData(data) {
    const password = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Use the encryption key from the environment variable
    const salt = crypto.randomBytes(16); // Generate random salt
    const iterations = 4000000; // Number of iterations
    const keyLength = 32; // Key length in bytes (256 bits)
    const digest = 'sha512'; // Hash function

    const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest); // Derive key from password using PBKDF2
    const iv = crypto.randomBytes(16); // Generate random IV (Initialization Vector)

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv); // Create AES cipher
    let encryptedData = cipher.update(data, 'utf8', 'hex'); // Encrypt data
    encryptedData += cipher.final('hex');

    return {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        encryptedData: encryptedData
    };
}

export function decryptData(encryptedData) {
    const password = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Use the encryption key from the environment variable
    const salt = Buffer.from(encryptedData.salt, 'hex'); // Convert salt from hex string to Buffer
    const iterations = 4000000; // Number of iterations
    const keyLength = 32; // Key length in bytes (256 bits)
    const digest = 'sha512'; // Hash function

    const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest); // Derive key from password using PBKDF2
    const iv = Buffer.from(encryptedData.iv, 'hex'); // Convert IV from hex string to Buffer

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); // Create AES decipher
    let decryptedData = decipher.update(encryptedData.encryptedData, 'hex', 'utf8'); // Decrypt data
    decryptedData += decipher.final('utf8');

    return decryptedData;
}

export function generateTransactionDelay(delayFrequency) {
    // Function to generate random numbers from a standard normal distribution
    function randn_bm() {
      var u = 0, v = 0;
      while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
      while(v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
  
    // Function to generate log-normal distribution
    function logNormal(mean, stdDev) {

      var u = randn_bm();
      return Math.exp(mean + stdDev * u);
    }
  
    // Parameters for log-normal distribution
    // Read configuration from config.json
    const { mixDelayMean, mixDelayStdDev } = readConfig();
  
    // Function to calculate multiplier based on delayFrequency
    function getMultiplier(delayFrequency) {
      switch (delayFrequency) {
          case 's':
              return 1;
          case 'm':
              return 20;
          case 'h':
              return 200;
          case 'd':
              return 2500;
          case 'w':
              return 15000;
          default:
              return 1;
      }
    }
  
    // Calculate multiplier
    var multiplier = getMultiplier(delayFrequency);
  
    // Generate a single data point with multiplier
    var mixDelay = logNormal(mixDelayMean, mixDelayStdDev) * multiplier;

    return mixDelay;
}

// Generate amplified master account probability for sending and receiving
export function masterAccountProbability(masterBalance, targetBalance, endIndex, totalAccountsWithBalance, isSending) {
    // Read configuration from config.json
    const { senderProbabilityWeight, senderLowBound, senderUpBound, receiverProbabilityWeight, receiverLowBound, receiverUpBound } = readConfig();

    //const probabilityWeight = 3; // at max, how many times more likely is the master account selected than a decoy account
    const ratio = masterBalance / targetBalance;

    let probability;
    if (isSending) {
        if (ratio >= senderUpBound) {
            probability = 1 / totalAccountsWithBalance * senderProbabilityWeight;
        } else if (ratio >= senderLowBound) {
            probability = Math.min(1, Math.max(0, (ratio - senderLowBound) / (senderUpBound-senderLowBound))) / totalAccountsWithBalance  * senderProbabilityWeight;
        } else {
            probability = 0;
        }
    } else {
        if (ratio <= receiverLowBound) {
            probability = 1 / (endIndex + 1) * receiverProbabilityWeight;
        } else if (ratio <= receiverUpBound) {
            probability = Math.max(0, Math.min(1, (receiverUpBound - ratio) / (receiverUpBound-receiverLowBound))) / (endIndex + 1) * receiverProbabilityWeight;
        } else {
            probability = 0;
        }
    }
    
    probability = probability; // limit the probability to 50% so there is still some variability
    //console.log("TEST - Send probability for master from utils page (should be 0): ",probability);

    return probability;
}

// Generate random transaction amount
function randn_bm() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Function to generate log-normal distribution
export function logNormal( mean, stdDev) {
    // Parameters for log-normal distribution
    //const mean = -2; // Decrease the mean to shift the curve to the left
    //const stdDev = 0.5; // Adjust standard deviation to control the spread
    const u = randn_bm();
    return Math.exp(mean + stdDev * u);
}



