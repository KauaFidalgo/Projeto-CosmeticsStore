import http from "http";

console.log("Testing API...");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/admin/financial/orders?period=month",
  method: "GET",
  headers: {
    "X-Role": "ADMIN",
    "Authorization": "Bearer admin-001",
  },
  timeout: 5000,
};

const req = http.request(options, (res) => {
  console.log("✅ Connected. Status:", res.statusCode);
  let body = "";
  res.on("data", (chunk) => { body += chunk; });
  res.on("end", () => {
    try {
      const data = JSON.parse(body);
      console.log("✅ Response parsed successfully");
      console.log("Total Orders:", data.summary.totalOrders);
      console.log("Total Revenue:", data.summary.totalRevenue);
      console.log("Items in data:", data.data?.length || 0);
      process.exit(0);
    } catch (e) {
      console.error("❌ Parse error:", e.message);
      console.log("Raw response:", body.substring(0, 200));
      process.exit(1);
    }
  });
});

req.on("error", (err) => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});

req.on("timeout", () => {
  console.error("❌ Request timeout");
  req.destroy();
  process.exit(1);
});

req.end();
