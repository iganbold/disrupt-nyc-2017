var restify = require('restify');
var builder = require('botbuilder');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, [
    function(session, results) {
        session.beginDialog('/getstarted');
    },
    function (session, results) {
        // var region = startData[results.response.entity];
        switch(results.response.entity) {
            case 'Start':
                session.beginDialog('/start');
                break;
            case 'Tutorial':

                break;
            default:

        }
        // session.send('result '+results.response.entity);
    }
]);



//*************************************************
// Get Started Section
// var startData = {
//     "Start": {
//         action: "start"
//     },
//     "Tutorial": {
//         action: "tutorial"
//     },
// };

bot.dialog('/getstarted', [
    function (session) {
        builder.Prompts.choice(session, "Let's start the adventure?", ["Start","Tutorial"]); 
    },
    function (session, results) {
        if (results.response) {
            session.endDialogWithResult(results);
        } else {
            session.beginDialog('/getstarted');
            // session.send("ok").endDialog();
        }
    }
]);

//*************************************************
// RESET secion
//  bot.use(builder.Middleware.dialogVersion({
//             version: 1.0,
//             message: 'Conversation restarted by a main update',
//             resetCommand: /^reset/i
//         }));


// Add dialog that runs only first time user visits
bot.dialog('firstTime', function(session){
    session.userData.firstRun = true;
    var card = new builder.AnimationCard(session)
        .title('Welcome to GROUP BUY ^_^')
        .image(builder.CardImage.create(session, 'https://docs.microsoft.com/en-us/bot-framework/media/how-it-works/architecture-resize.png'))
        .media([
            { url: 'https://media.giphy.com/media/2SoAk7x02i9aw/giphy.gif' }
        ]);

    // attach the card to the reply message
    var msg = new builder.Message(session).addAttachment(card);
    session.send(msg).endDialog();
}).triggerAction({
    onFindAction: function (context, callback) {
        // Only trigger if we've never seen user before
        if (!context.userData.firstRun) {
            // Return a score of 1.1 to ensure the first run dialog wins
            callback(null, 1.1);
        } else {
            callback(null, 0.0);
        }
    }
});


//*************************************************
bot.dialog('/start',[
    function(session) {
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel)
        msg.attachments([
            new builder.HeroCard(session)
                .title("Top 10 Featured Products")
                .subtitle("subtitle")
                .images([builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/originals/f6/d1/79/f6d1794ad4eb3001e973e1707de9a9c7.png')])
                .buttons([
                    builder.CardAction.imBack(session, "SELECT_TOPS", "Select")
                ]),
            new builder.HeroCard(session)
                .title("Categories")
                .subtitle("subtitle")
                .images([builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/originals/2c/23/56/2c235626cd393a5bef5bd865ce297d9e.png')])
                .buttons([
                    builder.CardAction.imBack(session, "SELECT_CATEGORIS","Select")
                ])
        ]);
        session.send(msg).endDialog();
    }
]);










// Add dialog to return list of shirts available
bot.dialog('showShirts', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("Classic White T-Shirt")
            .subtitle("100% Soft and Luxurious Cotton")
            .text("Price is $25 and carried in sizes (S, M, L, and XL)")
            .images([builder.CardImage.create(session, 'http://petersapparel.parseapp.com/img/whiteshirt.png')])
            .buttons([
                builder.CardAction.imBack(session, "buy classic white t-shirt", "Buy")
            ]),
        new builder.HeroCard(session)
            .title("Classic Gray T-Shirt")
            .subtitle("100% Soft and Luxurious Cotton")
            .text("Price is $25 and carried in sizes (S, M, L, and XL)")
            .images([builder.CardImage.create(session, 'http://petersapparel.parseapp.com/img/grayshirt.png')])
            .buttons([
                builder.CardAction.imBack(session, "buy classic gray t-shirt", "Buy")
            ])
    ]);
    session.send(msg).endDialog();
}).triggerAction({ matches: /^(show|list)/i });

var salesData = {
    "west": {
        units: 200,
        total: "$6,000"
    },
    "central": {
        units: 100,
        total: "$3,000"
    },
    "east": {
        units: 300,
        total: "$9,000"
    }
};

bot.dialog('salesData', [
    function (session) {
        builder.Prompts.choice(session, "Which region would you like sales for?", salesData); 
    },
    function (session, results) {
        if (results.response) {
            var region = salesData[results.response.entity];
            session.send("We sold %(units)d units for a total of %(total)s.", region).endDialog(); 
        } else {
            session.send("ok").endDialog();
        }
    }
]).triggerAction({matches: /^(sales)/i});



