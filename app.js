/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

bot.on('conversationUpdate', function(message) {
    // Send a hello message when bot is added
    if (message.membersAdded) {
        message.membersAdded.forEach(function(identity) {
            if (identity.id === message.address.bot.id) {
                var reply = new builder.Message().address(message.address).text("Hi! Welcome to LaundryMann.");
                bot.send(reply);
            }
        });
    }
});

var menuItems = { 
    "CARE UNLIMITED LAUNDRY PACK ₦35,000": {
        item: "careUnlimitedPack"
    },
    "CARE MAKE SENSE PACK ₦30,000": {
        item: "careMakesensePack"
    },
    "CARE NOT SINGLE PACK ₦15,450": {
        item: "careNotsinglePack"
    },
    "CARE SINGLE PACK ₦12,500": {
        item: "careSinglePack"
    },
}


bot.dialog("mainMenu", [
    function(session){
        builder.Prompts.choice(session, "Our Packages:", menuItems);
    },
    function(session, results){
        if(results.response){
            session.beginDialog(menuItems[results.response.entity].item);
        }
    }
])
.triggerAction({
    // The user can request this at any time.
    // Once triggered, it clears the stack and prompts the main menu again.
    matches: /^your package$/i,
    confirmPrompt: "This will cancel your request. Are you sure?"
});

bot.dialog('greetings',[ 
    function (session) {
        session.beginDialog('askName');
    },
    function (session, results) {
        session.endDialog(`Hello ${results.response}, My name is Eve. Checkout LaundryMann Packages below!`);
    }
]);
bot.dialog('askName', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.endDialogWithResult(results);
		session.beginDialog("mainMenu");
    }
]);


/*

bot.dialog('/', function (session) {
    session.send('You said ' + session.message.text);
});
*/
