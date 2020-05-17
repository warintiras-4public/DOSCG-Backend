const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');
const abc  = require('../models/DOSCG');

require('dotenv').config()

const router = express.Router();
const app = express();

app.use(express.json());

const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

router.get('/', (req, res) => {
    res.send('Hello SCG!');
});

router.get('/direction', cacheDirection, getDirection);
router.get('/abc', cacheAbc, findAandC);
router.get('/xyz', findXYZ);

// Find a and c
function findAandC(req, res, next) {
    try {
        console.log("Fetching abc ...");
  
        // a = 21, ab = 23, ac = -21;
        const a = abc.find(x => x.id === "a").value; 
        const ab = abc.find(x => x.id === "ab").value;
        const ac = abc.find(x => x.id === "ac").value;

        // b = 23-21;
        const b = ab-a;

        // c = -21-21
        const c = ac-a

        const bc = { b: b, c: c};

        const stringifyData = JSON.stringify(bc);

        // Set data to Redis
        client.setex(a, 3600, stringifyData);

        res.send(bc);
    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

// Find x, y, and z
function findXYZ(req, res, next) {
    res.send('Under construction...');
}

// Google Direction
async function getDirection(req, res, next) {
    try {
        console.log("Fetching direction ...");

        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        const api_url = `https://maps.googleapis.com/maps/api/directions/json?origin=13.805381,100.539025&destination=13.746314,100.539276&key=${GOOGLE_API_KEY}`;
        const fetch_response = await fetch(api_url);
        const data = await fetch_response.json();
        const stringifyData = JSON.stringify(data);

        // Set data to Redis
        client.setex(GOOGLE_API_KEY, 3600, stringifyData);
        
        res.send(data);
    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

// Cache middleware
function cacheDirection(req, res, next) {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    client.get(GOOGLE_API_KEY, (err, data) => {

        if (err) throw err;

        if(data!== null) {
            res.send(JSON.parse(data));
        } else {
            next();

        }
    })
}

function cacheAbc(req, res, next) {
    const a = abc.find(x => x.id === "a").value; 

    client.get(a, (err, data) => {

        if (err) throw err;

        if(data!== null) {
            res.send(JSON.parse(data));
        } else {
            next();

        }
    })
}

module.exports = router;