
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
    if (typeof token != "undefined") {
        let isExpired = await isTokenExpired(token)
        if (isExpired == true) {
            let token = fetchToken()
            await DBUpdateToken(token)
            console.log(token)
            return token
        } else {
            console.log(token)
            return token
        }
    } else {
        console.log("No Token in DB")
        let token = fetchToken()
        await DBWriteToken(token)
        console.log(token)
        return token
    }
}


//Fetch from Zoom API
//Function to get a new token from the Zoom API
async function fetchToken() {
    const response = await fetch(url, { method: 'POST', headers: auth })
    const data = await response.json()
    const token = data.access_token
    return token
}

//Database Functions

//Function to write a new token to the databse on first run
async function DBWriteToken(token) {
    const dbtoken = new tokenSchema({
        token_id: 0,
        token: token
    })
    dbtoken.save(function (err) {
        if (err) return handleError(err)
    })
}

//function to update the token value of the exisitng database DB entry
async function DBUpdateToken(token) {

    let doc = await tokenSchema.findOneAndUpdate({ token_id: 0 }, { "token": token }, function (err, result) {
        if (err) {
            console.log(err)
        } else {
            console.log("success")
        }
    })

}

//Function to get the token from the database
async function getTokenfromDB() {
    let token = await tokenSchema.findOne({ token_id: 0 }).exec()
    console.log("Getting Token From DB")
    if (typeof token != undefined) {
        return token.token
    } else {
        return undefined
    }
}

//function to check if a token is expired
function isTokenExpired(token) {
    const decodedToken = jwt.decode(token, { complete: true })
    const currentTime = Date.now().toString().slice(0, -3)
    if (decodedToken.payload.exp < currentTime) {
        console.log("Token is expired")
        return true
    } else {
        console.log("Token is NOT expired")
        return false
    }

}



//calling the getToken() function after waiting for the database to connect
setTimeout(() => { getToken(); }, 3000);


