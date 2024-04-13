import fs from 'fs'; // Import fs module for file system operations

// Function to read configuration from config.json
export function readConfig() {
    try {
        const rawData = fs.readFileSync('../config/config.json'); // Read the config.json file synchronously
        const config = JSON.parse(rawData); // Parse the JSON data
        //console.log('Configuration:', config); // Print the configuration to the console
        return config; // Return the parsed configuration
    } catch (error) {
        console.error('Error reading config file:', error); // Handle any errors
        throw error;
    }
}