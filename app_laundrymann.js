var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// This bot enables users to either make a dinner reservation or order dinner.
var inMemoryStorage = new builder.MemoryBotStorage();

// Main menu
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

// This is a reservation bot that has a menu of offerings.
var bot = new builder.UniversalBot(connector, [
    function(session){
       // session.send("Welcome to LaundryMann.");
		session.beginDialog("greetings");
    }
]).set('storage', inMemoryStorage); // Register in-memory storage 

/*
bot.on('conversationUpdate', function (message) {
        if (message.membersAdded && message.membersAdded.length > 0) {
            bot.send(new builder.Message().address(message.address).text('Welcome to LaundryMann.'));
			message
        }
}); 

*/
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

bot.dialog('greetings', [
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




// Display the main menu and start a new request depending on user input.
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

// This dialog prompts the user for a phone number. 
// It will re-prompt the user if the input does not match a pattern for phone number.


var laundrymannUnlimitedPack = {
    "CARE UNLIMITED LAUNDRY PACK-₦35,000 <br/>Unlimited Laundry items  <br/>Free Amendment <br/>Free Laundry <br/>24rs Service  <br/>Free once a month interior car wash  <br/>Renewal after 30Days <br/>": {
        Description: "Care Unlimited Laundry Pack",
        Price: 35000
    },
    /*"Check out<br/>": {
		Description: " Check out ",
        Price: 0 // Order total. Updated as items are added to order.
    },
	    "Cancel order": { // Cancel the order and back to Main Menu
        Description: " Cancel order ",
        Price: 0
    }*/
};
var laundrymannMakesensePack = {
    "CARE MAKE SENSE PACK-₦30,000 <br/>    Unlimited Laundry item<br/>    Renewal after 30 Days<br/>    Pick Ups<br/>    Free Laundry Bag<br/>    Customized clothing packaging arrangement": {
        Description: "Care Make Sense Pack",
        Price: 30000
    },
    "Check out": {
		Description: "Check out",
        Price: 0 // Order total. Updated as items are added to order.
    },
	    "Cancel order": { // Cancel the order and back to Main Menu
        Description: "Cancel order",
        Price: 0
    }
};
var laundrymannNotsinglePack = {
    "CARE NOT SINGLE PACK-₦15,450 <br/>    Covers 50 Laundry items<br/>    Request Pick up at your choice<br/>    Renewal after expiration of items<br/>    Free Ojireh Prime Card<br/>     Carry over of underutilized items":{
        Description: "Care Not-Single Pack",
        Price: 15450
	},
    "Check out": {
		Description: "Check out",
        Price: 0 // Order total. Updated as items are added to order.
    },
	    "Cancel order": { // Cancel the order and back to Main Menu
        Description: "Cancel order",
        Price: 0
    }
};

var laundrymannSinglePack = {
    "CARE SINGLE PACK-₦12,500 <br/>Covers 50 Laundry items<br/>    Request Pick up at your choice<br/>    Customized Clothing arrangement<br/>    Renewal after 30 days<br/>    Free Neo’s Wine Card":{
        Description: "Care Single Pack",
        Price: 12500
	},		
    "Check out": {
		Description: "Check out",
        Price: 0 // Order total. Updated as items are added to order.
    },
	    "Cancel order": { // Cancel the order and back to Main Menu
        Description: "Cancel order",
        Price: 0
    }
};

bot.dialog('addInfoRequestItems',[

    function (session) {
        session.send("Thanks for picking one of our package.");
        builder.Prompts.time(session, "What time will you be available for pick-up?");
    },
    function (session, results) {
        session.dialogData.availableDateTime = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.text(session, "Please can I know where you live?");
    },
    function (session, results) {
        session.dialogData.pickUpAddress = results.response;
        builder.Prompts.text(session, "Can I have your phone number?");
    },
    function (session, results) {
        session.dialogData.phoneNumber = results.response;

        // Process request and display reservation details
        session.send(`Your Information is confirmed. Information: <br/>Date/Time: ${session.dialogData.availableDateTime} <br/>Pickup Address: ${session.dialogData.pickUpAddress} <br/>Phone Number: ${session.dialogData.phoneNumber}`);
        session.send(`LaundryMann Pickup will soon be at your door step`);
		//session.endDialog();
    }
])
.endConversationAction(
    "endaddInfoRequestItems", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$|^stop$|^ok$|^okay$/i,
        //confirmPrompt: "This will cancel your order. Are you sure?"
    })



bot.dialog('careUnlimitedPack', [
    function(session){
        session.send("Lets make your laundry for you!");
		builder.Prompts.choice(session, "PACKAGE DETAILS:<br>", laundrymannUnlimitedPack );
    },
    function (session, results) {
        if (results.response) {
		//	var price =0;
		//	var description="Cancel Order"||"Check Out"
		//	var emptyOrder = `${order.Description.description} && ${order.Price.price}`;
		//	session.send("You are welocmee");
		//else if{
			var order = laundrymannUnlimitedPack[results.response.entity];
			var msg = `You ordered: ${order.Description} for a total of ₦${order.Price}.`;
            session.dialogData.order = order;
            session.send(msg);
			session.beginDialog("addInfoRequestItems");
            //builder.Prompts.text(session, "What is your room number?");

		//	}
        } 
    }
])

.endConversationAction(
    "endcareUnlimitedPack", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$|^stop$|^ok$|^okay$/i,
        confirmPrompt: "This will cancel your order. Are you sure?"
    })
.triggerAction({
    matches: /^main menu$/i,
    confirmPrompt: "This will cancel your current request. Are you sure?"
});	
	
	
bot.dialog('careMakesensePack', [
    function(session){
        session.send("Lets make your laundry for you!");
		builder.Prompts.choice(session, "PACKAGE DETAILS:<br>", laundrymannMakesensePack );
    },
    function (session, results) {
        if (results.response) {
            var order = laundrymannMakesensePack[results.response.entity];
            var msg = `You ordered: ${order.Description} for a total of ₦${order.Price}.`;
            session.dialogData.order = order;
            session.send(msg);
			session.beginDialog("addInfoRequestItems");
            //builder.Prompts.text(session, "What is your room number?");
        } 
    }
])

.endConversationAction(
    "endcareMakesensePack", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$|^stop$/i,
        confirmPrompt: "This will cancel your order. Are you sure?"
    })
.triggerAction({
    matches: /^main menu$/i,
    confirmPrompt: "This will cancel your current request. Are you sure?"
});



bot.dialog('careNotsinglePack', [
    function(session){
        session.send("Lets make your laundry for you!");
		builder.Prompts.choice(session, "PACKAGE DETAILS:<br>", laundrymannNotsinglePack );
    },
    function (session, results) {
        if (results.response) {
            var order = laundrymannNotsinglePack[results.response.entity];
            var msg = `You ordered: ${order.Description} for a total of ₦${order.Price}.`;
            session.dialogData.order = order;
            session.send(msg);
			session.beginDialog("addInfoRequestItems");
            //builder.Prompts.text(session, "What is your room number?");
        } 
    }
])

.endConversationAction(
    "endcareNotsinglePack", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$|^stop$/i,
        confirmPrompt: "This will cancel your order. Are you sure?"
    })
.triggerAction({
    matches: /^main menu$/i,
    confirmPrompt: "This will cancel your current request. Are you sure?"
});



bot.dialog('careSinglePack', [
    function(session){
        session.send("Lets make your laundry for you!");
		builder.Prompts.choice(session, "PACKAGE DETAILS:<br>", laundrymannSinglePack );
    },
    function (session, results) {
        if (results.response) {
            var order = laundrymannSinglePack[results.response.entity];
            var msg = `You ordered: ${order.Description} for a total of ₦${order.Price}.`;
            session.dialogData.order = order;
            session.send(msg);
			session.beginDialog("addInfoRequestItems");
            //builder.Prompts.text(session, "What is your room number?");
        } 
    }
])

.endConversationAction(
    "endcareSinglePack", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^end$|^stop$/i,
        confirmPrompt: "This will cancel your order. Are you sure?"
    })
.triggerAction({
    matches: /^main menu$/i,
    confirmPrompt: "This will cancel your current request. Are you sure?"
});


// Once triggered, will start the 'showDinnerCart' dialog.
// Then, the waterfall will resumed from the step that was interrupted.
//.beginDialogAction('showCartAction', 'showDinnerCart', {
  //  matches: /^show cart$/i,
   // dialogArgs: {
    //    showTotal: true
   // }
//});








