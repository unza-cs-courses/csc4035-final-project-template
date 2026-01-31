/**
 * CSC4035 Final Project - Main Application
 *
 * Entry point for your frontend application.
 * TODO: Add your application initialization and event handlers.
 */

// Application state
const App = {
    items: [],
    isLoading: false,

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing application...');

        // Set up event listeners
        this.setupEventListeners();

        // Load initial data
        await this.loadItems();

        console.log('Application ready!');
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Form submission
        const itemForm = document.getElementById('item-form');
        if (itemForm) {
            itemForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Dismiss error button
        const dismissError = document.getElementById('dismiss-error');
        if (dismissError) {
            dismissError.addEventListener('click', () => UI.hideError());
        }

        // Mobile menu toggle
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => UI.toggleMobileNav());
        }

        // Event delegation for item actions (edit/delete)
        const itemsList = document.getElementById('items-list');
        if (itemsList) {
            itemsList.addEventListener('click', (e) => this.handleItemAction(e));
        }

        // Get started button
        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                document.getElementById('app').scrollIntoView({ behavior: 'smooth' });
            });
        }
    },

    /**
     * Load all items from API
     */
    async loadItems() {
        try {
            UI.showLoading();
            UI.hideError();

            const response = await API.items.getAll();

            if (response.success) {
                this.items = response.data;
                UI.renderItems(this.items);
            }
        } catch (error) {
            UI.showError('Failed to load items. Please try again.');
            console.error('Load items error:', error);
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleFormSubmit(e) {
        e.preventDefault();

        const nameInput = document.getElementById('item-name');
        const name = nameInput?.value.trim();

        if (!name) {
            UI.showError('Please enter an item name.');
            return;
        }

        try {
            UI.showLoading();
            UI.hideError();

            const response = await API.items.create({ name });

            if (response.success) {
                this.items.unshift(response.data);
                UI.addItem(response.data);
                UI.clearForm(e.target);
            }
        } catch (error) {
            UI.showError('Failed to add item. Please try again.');
            console.error('Create item error:', error);
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Handle item action buttons (edit/delete)
     * @param {Event} e - Click event
     */
    async handleItemAction(e) {
        const target = e.target;

        // Delete button
        if (target.classList.contains('btn-delete')) {
            const id = target.getAttribute('data-id');
            await this.deleteItem(id);
        }

        // Edit button
        if (target.classList.contains('btn-edit')) {
            const id = target.getAttribute('data-id');
            await this.editItem(id);
        }
    },

    /**
     * Delete an item
     * @param {string} id - Item ID
     */
    async deleteItem(id) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            UI.showLoading();
            UI.hideError();

            await API.items.delete(id);

            // Remove from local state
            this.items = this.items.filter(item => item.id !== id);
            UI.removeItem(id);
        } catch (error) {
            UI.showError('Failed to delete item. Please try again.');
            console.error('Delete item error:', error);
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Edit an item
     * @param {string} id - Item ID
     */
    async editItem(id) {
        const item = this.items.find(i => i.id === id);
        if (!item) return;

        const newName = prompt('Enter new name:', item.name);
        if (!newName || newName.trim() === '' || newName === item.name) {
            return;
        }

        try {
            UI.showLoading();
            UI.hideError();

            const response = await API.items.update(id, { name: newName.trim() });

            if (response.success) {
                // Update local state
                const index = this.items.findIndex(i => i.id === id);
                if (index !== -1) {
                    this.items[index] = response.data;
                }
                UI.updateItem(response.data);
            }
        } catch (error) {
            UI.showError('Failed to update item. Please try again.');
            console.error('Update item error:', error);
        } finally {
            UI.hideLoading();
        }
    },
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
