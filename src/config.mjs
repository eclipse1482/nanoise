import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

export function readConfig() {
    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDir = dirname(currentFilePath);
    const configPath = join(currentDir, '../config/config.json');
    try {
        const rawData = fs.readFileSync(configPath, 'utf8'); // Read the config.json file synchronously
        const config = JSON.parse(rawData); // Parse the JSON data
        //console.log('Configuration:', config); // Print the configuration to the console
        return config; // Return the parsed configuration
    } catch (error) {
        console.error('Error reading config file:', error); // Handle any errors
        throw error;
    }
}





/* THIS WORKS ON LINUX, BUT NOT WINDOWS
import fs from 'fs'; // Import fs module for file system operations
import path from 'path';

// Function to read configuration from config.json
export function readConfig() {
    const currentFileUrl = new URL(import.meta.url);
    const currentDir = path.dirname(currentFileUrl.pathname);
    const configPath = path.join(currentDir, '../config/config.json');
    try {
        const rawData = fs.readFileSync(configPath, 'utf8'); // Read the config.json file synchronously
        const config = JSON.parse(rawData); // Parse the JSON data
        //console.log('Configuration:', config); // Print the configuration to the console
        return config; // Return the parsed configuration
    } catch (error) {
        console.error('Error reading config file:', error); // Handle any errors
        throw error;
    }
}*/
