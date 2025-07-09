require('dotenv').config();
const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const fs = require("fs")
const { XMLParser } = require("fast-xml-parser")

const upload = multer({
  dest: 'uploads/', limits: {
    fileSize: 1024 * 1024 * 1024  // 1 GB max
  }
})


const cors = require("cors");
const app = express();

const allowedOrigins = [
  'https://xml2bc-dev-uat-new-frontend.onrender.com',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

const tenantID = process.env.TENANT_ID;
const clientID = process.env.CLIENT_ID;
const clientSidecret = process.env.CLIENT_SECRET;
const scope = "https://api.businesscentral.dynamics.com";


app.get("/getToken", async (req, res) => {
  // const url = `https://login.microsoftonline.com/${tenantID}/oauth2/token`;
  const url = `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientID,
    client_secret: clientSidecret,
    scope: "https://api.businesscentral.dynamics.com/.default", // VERY IMPORTANT
  });

  try {

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()

    })
    if (!response.ok) {
      const errorData = await response.json();

      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: error.message });
  }
})

const PORT = process.env.PORT;

app.get('/', (req, res) => {
  res.send('DEVUAT Server is running');
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})