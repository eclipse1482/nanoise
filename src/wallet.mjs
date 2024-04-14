import { wallet } from 'nanocurrency-web'

// Set your seed as a string
const phrase = "forum wink dune flame figure concert young check spy meadow danger rebel run outside eager clay easily laptop trend rack sibling behind fine scorpion";

// Import a wallet with a seed
const seedWallet = wallet.fromLegacyMnemonic(phrase);

// Derive private keys for a seed
const seedAccounts = wallet.legacyAccounts(seedWallet.seed,0,1);

// Print the results to the console
console.log("Seed Wallet:", seedWallet);
console.log("Seed Accounts:", seedAccounts);
