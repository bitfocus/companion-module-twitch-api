## Custom Token Server

### Overview
Users who wish to have more control over token management, or integrate with existing infrastructure, can follow these steps to achieve this. Creating a server that listens/responds to HTTP requests is beyond the scope of this doc, but my recommendation for getting started is to either look into a simple NodeJS app running Express and storing the token data either in an encrypted file or in a database as this will also work in situations where the server is running locally and not exposed to the internet. Alternatively AWS API Gateway, Lambda, and DynamoDB, can make for a secure and always accessible serverless solution that is minimal cost (with many of these services having free tiers).

Token servers work by guiding a user through an OAuth flow (for single use cases this does not even have to require a web page, and can be started by copy/pasting the code from the redirect URI and manually processing the tokens, after which the token server can automate the rest of the process without user interaction). Once the OAuth process is completed the token server needs to respond to a GET request containing a GUID representing a user with the access token for that user.


### Step 1 - Create a TwitchDev account and register your application
To create and refresh OAuth tokens you must first register an app on the Twitch Dev site to gain a Client ID, Client Secret, and set the Redirect URI for your token server. Twitch's documentation on this can be found here: https://dev.twitch.tv/docs/authentication#registration


### Step 2 - Obtaining a User Access token and Refresh token
When creating an OAuth flow, ensure your token server is using the Authentication Code flow and all the scopes you wish to make requests with as documented here: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-authorization-code-flow

Implicit tokens can not be refreshed, and the Client Credentials flow creates an App Access Token, which is not usable for many of the functions performed by this module as a User Access Token is required.

Once a user has gone through the OAuth process you can store their tokens, along with an GUID to represent that user, and periodically refresh the token to get a new one (User Access Tokens have a variable expiration but it's approximately 4 hours). Documentaiton for refreshing can be found here: https://dev.twitch.tv/docs/authentication#refreshing-access-tokens


### Step 3 - Responding to Companion Twitch API module requests
For the module instance to request the access token from your custom token server it will make a HTTP GET request to the URL provided in the config, with `?id=` and your ID provided in the `token` config field appended. Your token server needs to use this `id` querystring param to retrieve the appropriate User Access Token from wherever you choose to store it, and send that token as the response body.