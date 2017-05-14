var restify = require('restify');
var builder = require('botbuilder');
var admin = require("firebase-admin");
var serviceAccount = require("./fb.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://plug-14dba.firebaseio.com"
});

var db = admin.database();
var refTop10 = db.ref("/Top10");
var refHome = db.ref("/Category/Home");
// var refTop10 = db.ref("/Top10");
// var refTop10 = db.ref("/Top10");
// var refTop10 = db.ref("/Top10");



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
 bot.use(builder.Middleware.dialogVersion({
    version: 1.0,
    message: 'Conversation restarted by a main update',
    resetCommand: /^reset/i
}));


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
// Add dialog that start the flow
bot.dialog('/start',[
    function(session) {
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel)
        msg.attachments([
            new builder.HeroCard(session)
                .title("Top 10 Featured Products")
                .images([builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/23/74/94/237494a0f452ef2b4ac60bd74f7da347.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "SELECT_START_TOPS", "Select")
                ]),
            new builder.HeroCard(session)
                .title("Categories")
                .images([builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/b4/d7/8c/b4d78c5a79fa5fcc63ce50c7a745cb9a.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "SELECT_START_CATEGORIS","Select")
                ])
        ]);
        session.send(msg).endDialog();
    }
]);

bot.dialog('/selectStart', [
    function(session, args, next) {
        var utterance = args.intent.matched[0];
        switch(utterance) {
            case 'SELECT_START_TOPS':
                // session.send("TOP").endDialog();
                session.beginDialog('/top10');
                break;
            case 'SELECT_START_CATEGORIS':
                session.beginDialog('/categories');
                break;
            default:
                session.send(utterance).endDialog();
        }
    }
]).triggerAction({ matches: /(SELECT_START_TOPS|SELECT_START_CATEGORIS)/i });


//*************************************************
// bot.dialog('/top10', [
//     function.
// ]);


bot.dialog('/top10', [
    function(session) {
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        var attachments = [];
        refTop10.once("value", function(snapshot) {
            snapshot.forEach(function(childSanpShot){
                attachments.push(
                    new builder.HeroCard(session)
                    .title(childSanpShot.val().price+"- "+childSanpShot.val().description)
                    .subtitle("Store Price: "+childSanpShot.val().storePrice+", Sold: "+childSanpShot.val().quantitySold)
                    .text(",Min: "+ childSanpShot.val().minimumQuantity)
                    .images([builder.CardImage.create(session, childSanpShot.val().url)])
                    .buttons([
                        builder.CardAction.imBack(session, "buy classic white t-shirt", "Buy")
                    ])
                );
            });

            msg.attachments(attachments);
            session.send(msg).endDialog();
        });
    }
]);

bot.dialog('/categories', [
    function(session) {
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel)
        msg.attachments([
            new builder.HeroCard(session)
                .title("Home")
                .images([builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/86/24/27/8624270b74466f4545a388d7712f806e.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "Select Home Category", "Select")
                ]),
            new builder.HeroCard(session)
                .title("Family")
                .images([builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/57/42/bc/5742bc118a9ca1b43621b21b662bd54e.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "Select Family Category", "Select")
                ]),
            new builder.HeroCard(session)
                .title("Electronics")
                .images([builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/bd/2f/51/bd2f513dbc4e65376c6a4724e0d910df.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "Select Electronics Category", "Select")
                ]),
            new builder.HeroCard(session)
                .title("Entertainment")
                .images([builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/originals/b3/9b/a0/b39ba0ef57b3416c0ec6a44c90905041.png')])
                .buttons([
                    builder.CardAction.imBack(session, "Select Entertainment Category", "Select")
                ]),
            new builder.HeroCard(session)
                .title("Clothing & Accessories")
                .images([builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/b4/4f/a6/b44fa63c526b827e8c50a9e590f38321.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "Select Clothing & Accessories Category", "Select")
                ])
        ]);  

        session.send(msg).endDialog();  
    }
]).triggerAction({ matches: /^(categories|category|Back to Categories)/i });


bot.dialog('/selectCategory', [
    function(session, args, next) {
        var utterance = args.intent.matched[0];
        switch(utterance) {
            case 'Select Home Category':
                // session.send("HOME").endDialog();
                // session.beginDialog('/homeCategory');
                var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                let attachments = [];
                refHome.once("value", function(snapshot) {
                    snapshot.forEach(function(childSanpShot){
                        attachments.push(
                            new builder.HeroCard(session)
                            .title(childSanpShot.val().price+", "+childSanpShot.val().description)
                            .subtitle("Store Price: "+childSanpShot.val().storePrice+", Willing to Buy: "+childSanpShot.val().quantitySold)
                            .text("MinQt:"+childSanpShot.val().minimumQuantity)
                            .images([builder.CardImage.create(session, childSanpShot.val().url)])
                            .buttons([
                                builder.CardAction.imBack(session, "Add:"+childSanpShot.key, "Add")
                            ])
                        );
                    });

                    msg.attachments(attachments);
                    session.send(msg).endDialog();
                });

                break;
            case 'Select Family Category':
                session.send("Family").endDialog();
                // session.beginDialog('/categories');
                break;
            case 'Select Electronics Category':
                session.send("Electronics").endDialog();
                // session.beginDialog('/categories');
                break;
            case 'Select Entertainment Category':
                session.send("Entertainment").endDialog();
                // session.beginDialog('/categories');
                break;
            case 'Select Clothing & Accessories Category':
                session.send("Clothing & Accessories").endDialog();
                // session.beginDialog('/categories');
                break;
            default:
                session.send(utterance).endDialog();
        }
    }
]).triggerAction({ matches: /(Select Home Category|Select Family Category|Select Electronics Category|Select Entertainment Category|Select Clothing & Accessories Category)/i });




bot.dialog('add', [
    function(session,args, next) {
        var utterance = args.intent.matched[0];
        builder.Prompts.choice(session, "Added to shopping cart! Would you like to continue or show shopping cart?", "Back to Categories|Shopping Cart"); 
    },
    function(session, results) {
        if (results.response) {
            // var region = salesData[results.response.entity];
            // session.send(""+results.response.entity).endDialog(); 
            switch(results.response.entity) {
                case 'Back to Categories':
                    session.beginDialog('/categories');
                    break;
                case 'Shopping Cart':
                    // session.beginDialog(results.response.entity);
                    session.beginDialog('/cart');
                    break;
                default:

            }
            
        } else {
            // session.send("ok").endDialog();
        }    
    }
]).triggerAction({matches: /^(Add:)/i});

var order = 1234;

bot.dialog('/cart', [
    function(session,args, next) { 
        var card = new builder.ReceiptCard(session)
            .title('Itgel Ganbold')
            .facts([
                builder.Fact.create(session, order++, 'Order Number')
            ])
            .items([
                builder.ReceiptItem.create(session, '$ 276.23', 'iRobot Roomba 650')
                    .quantity(1)
                    .image(builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/4a/51/c5/4a51c539f4a1b2da296dc203bfe654e2.jpg')),
                builder.ReceiptItem.create(session, '$ 40.99', 'DeLonghi Espresso Maker')
                    .quantity(1)
                    .image(builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/35/09/7d/35097de5ffe7c73d38c511b9683daf3a.jpg'))
            ])
            .tax('$ 31.21')
            .total('$ 398.39')
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/pricing/', 'More Information')
                    .image('https://raw.githubusercontent.com/amido/azure-vector-icons/master/renders/microsoft-azure.png')
        ]); 

        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);

        builder.Prompts.choice(session, "Would like to pay?", "Pay"); 
    }, function(session, results) {
        if (results.response) {
            switch(results.response.entity) {
                case 'Pay':
                    session.beginDialog('/pay');
                    break;
                default:
            }
            
        } else {
            session.send("ok").endDialog();
        }    
    } 
]);

bot.dialog('/pay', [
    function(session,args, next) { 
        var card = new builder.ReceiptCard(session)
            .title('Itgel Ganbold')
            .facts([
                builder.Fact.create(session, order++, 'Order Number'),
                builder.Fact.create(session, 'VISA 5555-****', 'Payment Method')
            ])
            .items([
                builder.ReceiptItem.create(session, '$ 276.23', 'iRobot Roomba 650')
                    .quantity(1)
                    .image(builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/4a/51/c5/4a51c539f4a1b2da296dc203bfe654e2.jpg')),
                builder.ReceiptItem.create(session, '$ 40.99', 'DeLonghi Espresso Maker')
                    .quantity(1)
                    .image(builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/564x/35/09/7d/35097de5ffe7c73d38c511b9683daf3a.jpg'))
            ])
            .tax('$ 31.21')
            .total('$ 398.39')
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/pricing/', 'More Information')
                    .image('https://raw.githubusercontent.com/amido/azure-vector-icons/master/renders/microsoft-azure.png')
        ]); 

        var msg = new builder.Message(session).addAttachment(card);
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



