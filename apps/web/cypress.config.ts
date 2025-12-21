// @ts-nocheck
import { defineConfig } from "cypress";

export default defineConfig({
    projectId: "h6sygk",
    e2e: {
        baseUrl: "http://localhost:3003",
        viewportWidth: 1280,
        viewportHeight: 720,
        setupNodeEvents(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
            // implement node event listeners here
            return config;
        },
    },
});
