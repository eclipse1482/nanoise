# nanoise

This project is in beta. Please send me your feedback, bugs, suggestions, questions, etc. I want to make sure others are having success with this program and I have a few other features I want to add prior to releasing version 1.0.0.

Improve privacy of your Nano cryptocurrency account balance by using the CLI program nanoise to *create noise* by shuffling transactions among many of your addresses. The goal of this project is not to defeat powerful chain analysis, but to make it challenging or impossible for casual observers to determine your overall account balance and decipher real transactions from decoy transactions.

Nano's makes this possible by creating many addresses tied to the same seed. To the casual observer, these addresses are unlinked to eachother. However, they are all controlled by a single seed and wallet.

While this is a benefit, it is also a challenge because it can become difficult to manage and maintain multiple addresses. Nanoise solves this by setting a target balance for your main address (i.e., index 0 address). If your main address balance drifts above your target balance, it will prioritize sending funds away from your main address. If your main address balance drops below your target balance, nanoise will prioritize sending more funds to your main address. You could have 10, 100, or 1,000 addresses shuffling funds, but you can be confident that your main account balance will always have the funds available that you need.

If desired, you could still send funds from your decoy accounts, but then you will be linking your identify to your decoys. It is my opinion that you have better privacy by transacting from your main address because your counterparty will likely already know your identify and they won't be able to see your full balance or know what transactions are real or decoys.

If you need to achieve true anonymity, this program is not designed for you. In that case, you should use a crypto like Monero. However, I believe this achieves a good level of privacy in a secure, self-hosted, user friendly, and free program. **Important:** This program does not save your mnemonic phrase or seed phrase. You accounts are derived from the seed phrase and then the seed phrase is disposed of. Your accounts are encrypted with PBKDF2 with 4 million iterations. They are only decrypted for the few seconds it takes to process a transaction.

## Installation

The simplest way to install and use this program is to download the files from the repository to a folder on your computer. Install node.js on your PC, then cd to the nanoise folder/src and type the command "node index.mjs". Make sure you have entered your API Key in the config.json file.

The following method is worth a try, and if you are persistent it will provide a good user experience because "nanoise" can be called from your terminal at any location. I struggled setting this up at first, but the issue largely came down to the version of Node.js I had installed.

1. Install Node.js:

    Make sure you have Node.js installed on your system. You can download it from nodejs.org. If you are getting import errors, etc., you might need to download a newer version of node.js <https://nodejs.org/en/download/package-manager/>

2. Install nanoise globally:

    Open your terminal or command prompt.
    Run the following command to globally install nanoise:
    npm install -g nanoise

    If you are on Linux, you might need to run this command as sudo.

    **The install location can be determined on Mac/Linux by typing "npm list -g" or on Windows navigating to C:\Users\{YourUsername}\AppData\Roaming\npm\node_modules. You will need this location to update your config.json file to add your API key.**

3. Verify installation:

    After installation, you can verify that NaNoise is installed correctly by running:
    nanoise --version

    This command should display the version of NaNoise installed.

4. Run nanoise:

    Once installed, you can run NaNoise from any terminal at any location by simply typing:
    nanoise

## Usage

1. If installed globally as described in the [Installation section](#installation), nanoise can be run by typing "nanoise" into your terminal.

2. Mnemonic Phrase Prompt: At first startup, you will be prompted to add your mnemonic phrase. Currently it is only possible to import a 24 word nano mnemonic phrase. I will add additional options in the future. **Important:** Your mnemonic phrase and seed phrase are not stored. They are used to generate your accounts and then they are disposed of. Your accounts are encrypted and are only decrypted when required to process transactions.

3. Password Prompt: This password will be used to encrypt your wallet derived from you mnemonic phrase. The encryption algorithm is PBKDF2 with 4 million iterations. Please note, your seed phrase is never stored, only the accounts derived from your seed phrase. However, the private keys for each address are also derived in order to do the shuffling. This is the reason I hardened the encryption settings to 4 million iterations.

4. End Index prompt: This essentially is the number of decoy accounts. If you ever wanted to sweep these addresses into a new wallet, you can sweep indexes 0 through End Index. Steps 2 - 4 combine to create your wallet.

5. Shuffle Frequency Prompt: This value adjusts how often the Master address will be selected to send or receive transactions. Available options are Seconds, Minutes, Hours, Days, or Weeks. The exact delay is randomized, but on average, the transactions will occur on intervals measured in the selected frequency unit.

6. The program now loops indefinitely, sending random amounts, to and from random accounts, at random times.

7. Future starts will give you the option to import your existing wallet by entering your password, selcting a target balance and transaction frequency. Or, you can overwrite your wallet and enter a new or same mnemonic phrase. Entering the same phrase will give you the ability to adjust the End Index of your wallet.

Many parameters can be adjusted in the config.json file. There are three spreadsheets attached which let you adjust the parameters and see the impact on the algorithms. See the [Configuration section below.](#configuration)

Some cautions:

- You will need to sign up for an API key at <https://rpc.nano.to>. API keys do have a free use threshold. Or, you can change the RPC node in the config.json file if you would like.
- If you select frequency in the seconds, or have too many addresses included and too short of frequency, you will exceed your free RPC credits and the program will fail. The simple solution is to buy credits at <https://rpc.nano.to>
- I don't think more transactions are necessarily better. I would probably set the frequency to match how often you use your wallet normally, but evaluate for yourself and decide what makes the most sense for you.
- More addresses generally means smaller transaction amounts because your total balance is spread among more accounts. Transaction amounts are based on a random percentage of the sender accounts balance.

## Configuration

Reminder: You must update your API Key in the configuration file prior to first use or you will not be able to process blocks. The result will be "Block hash: undefined". You can update your config.json file by navigating to the install location of your program. If you installed it with NPM, **The install location can be determined on Mac/Linux by typing "npm list -g" or on Windows navigating to C:\Users\{YourUsername}\AppData\Roaming\npm\node_modules.**

Listed below are the configuration parameters and their uses:

- "rpcUrl": "https://rpc.nano.to" - This is the url to the rpc node you are using. I have it defaulted to rpc.nano.to.
- "apiKey": "YOUR API KEY HERE" - This is your API Key for the rpc node you are using. rpc.nano.to allows free API keys which will work for most uses.
    "workSendBlockDifficulty": "fffffff800000000" - This is the send block POW difficulty. In the future I will determine this dynamically, but for now it is most likely ok to leave this as is.
    "workReceiveBlockDifficulty": "fffffe0000000000" - This is the receive block POW difficulty. In the future I will determine this dynamically, but for now it is most likely ok to leave this as is.
    "senderProbabilityWeight": 2 - This is the multiplier applied to the likelihood of selecting the Master address as the sender. Please see the spreadsheet "Compare Probabilities for Master to Send or Receive.ods" file for more details.
    "senderLowBound": 0.5 - If your Master Balance / Target Balance drops below this, the probability for Master to send funds = 0%. Please see the spreadsheet "Compare Probabilities for Master to Send or Receive.ods" file for more details.
    "senderUpBound": 2 - If your Master Balance / Target Balance rises above this, the probability for Master to send funds = (1 / Total Address) x senderProbability Weight. Please see the spreadsheet "Compare Probabilities for Master to Send or Receive.ods" file for more details.
    "receiverProbabilityWeight": 3 - This is the multiplier applied to the likelihood of selecting the Master address as the receiver. Please see the spreadsheet "Compare Probabilities for Master to Send or Receive.ods" file for more details.
    "receiverLowBound": 0.2 - If your Master Balance / Target Balance drops below this, the probability for Master to receive funds = (1 / Total Address) x receiverProbability Weight. Please see the spreadsheet "Compare Probabilities for Master to Send or Receive.ods" file for more details.
    "receiverUpBound": 2 - If your Master Balance / Target Balance rises above this, the probability for Master to receive funds = 0%. Please see the spreadsheet "Compare Probabilities for Master to Send or Receive.ods" file for more details.
    "mixDelayMean": 4 - mixDelay is a random number based on a log-normal distribution. Reducing the mean shortens the mixDelay while increasing the mean lengthens the mixDelay. Please see "Transaction Delay Calculations.ods" for more details.
    "mixDelayStdDev": 1 - mixDelay is a random number based on a log-normal distribution. Reducing the Standard Deviation condenses the distribution of the results while increasing it broadens the distribution of results. Please see "Transaction Delay Calculations.ods" for more details.
    "txAmountMean": -2 - The transaction amount is calculated based on a log-normal distribution to determine what percentage of the account balance should be sent. Reducing the mean will reduce the average transaction amount. Please see "Transaction Amount Calculations.odst" for more information.
    "txAmountStdDev": 0.5 - The transaction amount is calculated based on a log-normal distribution to determine what percentage of the account balance should be sent. Reducing the standard deviation will reduce the breadth of transaction amounts that can be expected. Please see "Transaction Amount Calculations.odst" for more information.

**Note:**  There are many configuration options available. I have set these to what worked best for me in my tests. If you want to adjust them, please first simulate the impact your changes will have by reviewing the attached .ods files.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
