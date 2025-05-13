// Save Manager for handling local storage operations

class SaveManager {
    constructor() {
        this.SAVE_KEY = 'gameSaveData';
        this.DEFAULT_SAVE_DATA = {
            version: '1.0.0',
            player: {
                currentPlane: 'default',
                currency: {
                    primary: 0,
                    special: 0
                }
            },
            planes: {
                default: {
                    unlocked: true,
                    upgrades: {
                        speed: 0,
                        maneuverability: 0,
                        firepower: 0,
                        health: 0
                    }
                }
            },
            achievements: {},
            highScores: {
                singlePlayer: 0,
                survival: 0
            },
            settings: {
                soundVolume: 1.0,
                musicVolume: 1.0,
                difficulty: 'normal'
            }
        };
    }

    /**
     * Save the current game state to localStorage
     * @param {Object} gameState - The current game state to save
     * @returns {boolean} - Whether the save was successful
     */
    saveGame(gameState) {
        try {
            const saveData = {
                ...this.DEFAULT_SAVE_DATA,
                ...gameState,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            return false;
        }
    }

    /**
     * Load the game state from localStorage
     * @returns {Object} - The loaded game state or default data if no save exists
     */
    loadGame() {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (!savedData) {
                return this.DEFAULT_SAVE_DATA;
            }

            const loadedData = JSON.parse(savedData);
            
            // Validate the loaded data
            if (!this.validateSaveData(loadedData)) {
                console.warn('Invalid save data detected, returning default data');
                return this.DEFAULT_SAVE_DATA;
            }

            return loadedData;
        } catch (error) {
            console.error('Error loading game:', error);
            return this.DEFAULT_SAVE_DATA;
        }
    }

    /**
     * Validate the structure of the save data
     * @param {Object} data - The save data to validate
     * @returns {boolean} - Whether the data is valid
     */
    validateSaveData(data) {
        // Check if all required top-level keys exist
        const requiredKeys = ['version', 'player', 'planes', 'achievements', 'highScores', 'settings'];
        for (const key of requiredKeys) {
            if (!(key in data)) {
                return false;
            }
        }

        // Add more specific validation as needed
        return true;
    }

    /**
     * Delete the current save data
     * @returns {boolean} - Whether the deletion was successful
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.SAVE_KEY);
            return true;
        } catch (error) {
            console.error('Error deleting save:', error);
            return false;
        }
    }

    /**
     * Export save data as a string
     * @returns {string} - The save data as a string
     */
    exportSave() {
        try {
            const saveData = localStorage.getItem(this.SAVE_KEY);
            return saveData ? btoa(saveData) : null;
        } catch (error) {
            console.error('Error exporting save:', error);
            return null;
        }
    }

    /**
     * Import save data from a string
     * @param {string} saveString - The save data string to import
     * @returns {boolean} - Whether the import was successful
     */
    importSave(saveString) {
        try {
            const saveData = atob(saveString);
            const parsedData = JSON.parse(saveData);
            
            if (!this.validateSaveData(parsedData)) {
                return false;
            }

            localStorage.setItem(this.SAVE_KEY, saveData);
            return true;
        } catch (error) {
            console.error('Error importing save:', error);
            return false;
        }
    }
}

// Export the SaveManager class
export default SaveManager; 