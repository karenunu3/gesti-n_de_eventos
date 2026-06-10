const http = require('http');

async function testLogin() {
  console.log("Intentando login...");
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "admin@istpet.edu.ec", password: "password123" })
  });
  
  const loginData = await loginRes.json();
  console.log("Login HTTP Status:", loginRes.status);
  
  if (!loginRes.ok) {
    console.error("Error en login:", loginData);
    return;
  }
  
  console.log("Login exitoso. Token obtenido.");
  
  console.log("Intentando fetch a /events/current-month...");
  const eventsRes = await fetch('http://localhost:4000/api/events/current-month', {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  
  const eventsData = await eventsRes.json();
  console.log("Events HTTP Status:", eventsRes.status);
  if (!eventsRes.ok) {
    console.error("Error en events:", eventsData);
    return;
  }
  
  console.log("Events fetch exitoso. Todo funciona correctamente en el backend.");
}

testLogin();
