
const mongoose = require('mongoose')
const base64 = require('base-64')
const fetch = require('node-fetch')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const tokenSchema = require('./schemas/token')

//credentials created in the Zoom server to server oauth app on Zoom Marketplace
const clientID = process.env.clientID
const clientSecret = process.env.clientSecret
const accountID = process.env.accountID
//created encoded token
const token = base64.encode(`${clientID}:${clientSecret}`)
//URL for the Oauth token API endpoint
const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountID}`
//configuring auth for fetch
const auth = { "Authorization": `Basic ${token}` }


//connect to MongoDB
mongoose.connect(process.env.dbConnectString, { autoIndex: false })
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("DB Connected successfully");
});


//Main Function. Call this function only.
//This function fetches the token from mongoDB if it does not exist it get s anew token from the zoom API and writes it to the DB and then returns the token
//If the token does exist in mongoDB it checks to see if the token is expired
//If the token is expired it fetches a new token updates the database and returns the enw token
//If the token is not expired it returns the token originally obtained from the database
async function getToken() {
    let token = await getTokenfromDB()
    console.log(`getToken: ${token}`)
    if (typeof token != "undefined") {
        let isExpired = isTokenExpired(token)
        if (isExpired == true) {
            let token = fetchToken()
            await DBUpdateToken(token)
            token.then((token) => console.log(token))
            return token
        } else {
            console.log(token)
            return token
        }
    } else {
        console.log("No Token in DB")
        let newToken = fetchToken()
        newToken.then((newToken) => console.log())
        await DBWriteToken(newToken)
        console.log(newToken)
        return newToken
    }
}


//Fetch from Zoom API
//Function to get a new token from the Zoom API
async function fetchToken() {
    const response = await fetch(url, { method: 'POST', headers: auth })
    const data = await response.json()
    //console.log(data)
    const token = data.access_token
    //console.log(`fetchTOken: ${token}`)
    return token
}

//Database Functions



//Function to get the token from the database
async function getTokenfromDB() {
    console.log("getTokenFromDB")
    try {
        let token = await tokenSchema.findOne({ token_id: 0 }).exec().then((token) => {
            console.log(`Token in DB is ${token.token}`)
            return token.token
        })


    } catch (error) {
        return undefined
    }
}

//function to check if a token is expired
function isTokenExpired(token) {
    console.log("isTokenExpired")
    const decodedToken = jwt.decode(token, { complete: true })
    console.log(decodedToken)
    const currentTime = Date.now().toString().slice(0, -3)
    if (decodedToken.payload.exp < currentTime) {
        console.log("Token is expired")
        return true
    } else {
        console.log("Token is NOT expired")
        return false
    }

}


//function to update the token value of the exisitng database DB entry
async function DBUpdateToken(newToken) {
    console.log("DBUpdateToken")
    let filter = "{ token_id: 0 }"
    let update = `{ token: ${newToken}}`
    let options = { new: true, overwrite: true }
    let token = await tokenSchema.findOneAndUpdate(filter, update, options)
        .then((doc) => {
            console.log(`update oauth token to DB finished! ${doc}`);
        })
        .catch(err => {
            console.log('update oauth token error:', err);
        });
    return token;
}



async function DBWriteToken(newToken) {
    console.log("dbWriteToken")
    newToken.then(async (newToken) => {
        data = {
            token_id: 0,
            token: newToken
        }
        try {
            const doc = new tokenSchema(data)
            await doc.save()
            return doc
        } catch (error) {
            console.log(error)
        }
    })

}

//calling the getToken() function after waiting for the database to connect
setTimeout(() => { getToken(); }, 3000);


