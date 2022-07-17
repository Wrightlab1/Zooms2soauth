# Zoom Server to Server OAuth Token Management

Can fetch and manage the Server to Server OAuth token. Ensuring that you always have a non-expired access toke

## Installation

Clone using `https://github.com/Wrightlab1/Zooms2soauth.git`

## Configuration
Create a `.env` with the following information
```
clientID = "YouZoomClientID"
clientSecret = "YourZoomClientSecret"
accountID = "YourZoomAccountID"
dbConnectString = "MongoDB connection String"
```
## Usage
There is only one function to call
```
getToken()
```
This function will return a valid Server to Server OAuth token