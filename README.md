# nanoise

This project is in beta. Please send me your feedback, bugs, suggestions, questions, etc. I want to make sure others are having success with this program and I have a few other features I want to add prior to releasing version 1.0.0.

Improve privacy of your Nano cryptocurrency account balance by shuffling transactions among many of your addresses. The goal of this project is not to defeat powerful chain analysis, but to make it challenging or impossible for casual observers to determine your overall account balance and decipher real transactions from decoy transactions.

Nano's makes this possible by creating many addresses tied to the same seed. To the casual observer, these addresses are unlinked to eachother. However, they are all controlled by a single seed and wallet.

While this is a benefit, it is also a challenge because it can become difficult to manage and maintain multiple addresses. Nanoise solves this by setting a target balance for your main address (i.e., index 0 address). If your main address balance drifts above your target balance, it will prioritize sending funds away from your main address. If your main address balance drops below your target balance, nanoise will prioritize sending more funds to your main address. You could have 10, 100, or 1,000 addresses shuffling funds, but you can be confident that your main account balance will always have the funds available that you need.

If desired, you could still send funds from your decoy accounts, but then you will be linking your identify to your decoys. It is my opinion that you have better privacy by transacting from your main address because your counterparty will likely already know your identify and they won't be able to see your full balance or know what transactions are real or decoys.

If you need to achieve true anonymity, this program is not designed for you. In that case, you should use a crypto like Monero. However, I believe this achieves a good level of privacy in a secure, self-hosted, user friendly, and free program.

## Installation

I will be adding this as an NPM package, but this is not done yet. Once complete, you can follow these steps:

1. Install Node.js:

    Make sure you have Node.js installed on your system. You can download it from nodejs.org.

2. Install NaNoise globally:

    Open your terminal or command prompt.
    Run the following command to globally install NaNoise:
    npm install -g nanoise

3. Verify installation:

    After installation, you can verify that NaNoise is installed correctly by running:
    nanoise --version

    This command should display the version of NaNoise installed.

4. Run nanoise:

    Once installed, you can run NaNoise from any terminal at any location by simply typing:
    nanoise

For now, all of the files are uploaded to this repository. Download them to a folder on your computer, open a terminal, navigate to the folder, and run "node index.js". Running the index.js file will start the program. You might need to install node.js and the following NPM packages: axios, prompts, and nanocurrency-web

## Usage

1. If installed globally as described in the **Installation** section, nanoise can be run by typing "nanoise" into your terminal.

2. Mnemonic Phrase Prompt: At first startup, you will be prompted to add your mnemonic phrase. Currently it is only possible to import a 24 word nano mnemonic phrase. I will add additional options in the future.

3. Password Prompt: This password will be used to encrypt your wallet derived from you mnemonic phrase. The encryption algorithm is PBKDF2 with 4 million iterations. Please note, your seed phrase is never stored, only the accounts derived from your seed phrase. However, the private keys for each address are also derived in order to do the shuffling. This is the reason I hardened the encryption settings to 4 million iterations.

4. End Index prompt: This essentially is the number of decoy accounts. If you ever wanted to sweep these addresses into a new wallet, you can sweep indexes 0 through End Index. Steps 2 - 4 combine to create your wallet.

5. Shuffle Frequency Prompt: This value adjusts how often the Master address will be selected to send or receive transactions. Available options are Seconds, Minutes, Hours, Days, or Weeks. The exact delay is randomized, but on average, the transactions will occur on intervals measured in the selected frequency unit.

6. The program now loops indefinitely, sending random amounts, to and from random accounts, at random times.

7. Future starts will give you the option to import your existing wallet by entering your password, selcting a target balance and transaction frequency. Or, you can overwrite your wallet and enter a new or same mnemonic phrase. Entering the same phrase will give you the ability to adjust the End Index of your wallet.

Many parameters can be adjusted in the config.json file. There are three spreadsheets attached which let you adjust the parameters and see the impact on the algorithms. See the **Configuration** section below.

Some cautions:

- You will need to sign up for an API key at <https://rpc.nano.to>. API keys do have a free use threshold. Or, you can change the RPC node in the config.json file if you would like.
- If you select frequency in the seconds, or have too many addresses included and too short of frequency, you will exceed your free RPC credits and the program will fail. The simple solution is to buy credits at <https://rpc.nano.to>
- I don't think more transactions are necessarily better. I would probably set the frequency to match how often you use your wallet normally, but evaluate for yourself and decide what makes the most sense for you.
- More addresses generally means smaller transaction amounts because your total balance is spread among more accounts. Transaction amounts are based on a random percentage of the sender accounts balance.

## Configuration

ToDo: Many configurations are available as well as spreadsheets to allow you to adjust parameters and see what their impacts will be on the program.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
