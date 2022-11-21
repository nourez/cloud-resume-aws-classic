const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: '24e41c',
  e2e: {
    baseUrl: "https://bv2d7v39v8.execute-api.ca-central-1.amazonaws.com/prod/",
  },
});
