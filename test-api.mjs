#!/usr/bin/env node

import http from "http";

async function testFinancialAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/financial/orders?period=month&page=1&pageSize=10",
      method: "GET",
      headers: {
        "X-Role": "ADMIN",
        Authorization: "Bearer admin-001",
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log("✅ Status:", res.statusCode);
        console.log("✅ Response:", data);
        resolve();
      });
    });

    req.on("error", (error) => {
      console.error("❌ Error:", error.message);
      reject(error);
    });

    req.end();
  });
}

testFinancialAPI()
  .then(() => {
    console.log("\n✅ API test completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ API test failed:", err.message);
    process.exit(1);
  });
