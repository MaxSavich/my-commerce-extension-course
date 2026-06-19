const { defineConfig } = require("@adobe/aio-commerce-lib-app/config");

module.exports = defineConfig({
  metadata: {
    id: "commerce-oop-course-ms",
    displayName: "Commerce OOP Course MS",
    version: "1.0.0",
    description:
      "Course app: product enrichment, order events, validation, and the Enriched Orders admin dashboard.",
  },
  adminUiSdk: {
    registration: {
      menuItems: [
        {
          id: 'order_enrichment_admin::apps',
          title: 'Order Enrichment',
          isSection: true,
          sortOrder: 100,
        },
        {
          id: 'order_enrichment_admin::enriched_orders',
          title: 'Enriched Orders',
          parent: 'order_enrichment_admin::apps',
          sortOrder: 1,
        },
      ],
    },
  },
});
