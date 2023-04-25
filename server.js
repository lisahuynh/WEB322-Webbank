/* WEB322 - Assignment 3: Web Bank
Author: Lisa Huynh
Date: November 26, 2022
*/

var HTTP_PORT = process.env.PORT || 3000;

const express = require("express");
const exphbs = require('express-handlebars');
const path = require("path");
const app = express();
var fs = require("fs");
const Handlebars = require("handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const randomStr = require("randomstring");
var userObj = JSON.parse(fs.readFileSync('./user.json'));
var acctObj = JSON.parse(fs.readFileSync('./accounts.json'));
var strRandom = randomStr.generate();
const MongoClient = require("mongodb").MongoClient;   
const uri = "mongodb+srv://lisa_huynh:admin123@mongodbatlas.rqj61tw.mongodb.net/?retryWrites=true&w=majority";                                  
//const uri = "mongodb://127.0.0.1:27017/mongodatabase";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    defaultLayout: false,
    layoutsDir: path.join(__dirname, "/views")
}));

app.set("view engine", ".hbs");
app.use(express.static(path.join(__dirname, './public')));

app.set("trust proxy", 1);

app.use(session({
    secret: strRandom,
    saveUninitialized: true,
    resave: false,
    cookie: {
        expires: 500000
    }
}));

async function getAcctDataFromDb(user) {
    let chequingAccount, savingsAccount;

    try {
        const client = await MongoClient.connect(uri);
        const db = client.db('mongodatabase');
        const result = await db.collection("client").findOne({ Username: user });

        chequingAccount = result.Chequing;
        savingsAccount = result.Savings;
    } catch (err) {
        console.log(`err = ${err}`);
    }

    return { chequingAccount, savingsAccount };
}

const home = require("./homePage.js");
app.use("/", home);

//validates user credentials; if successful, page will redirect; if not successful, two types of error messages will display
app.post("/login", async (req, res) => {
    const user = req.body.username;
    const password = req.body.password;
    req.session.username = req.body.username;
    
    const hbshelpers = require('./hbs-helpers.js');
    hbshelpers.newAccountDisabled();
    hbshelpers.noAccountDisabled();
    hbshelpers.checked();

    let chequingAccount, savingsAccount;
    const result = await getAcctDataFromDb(user);
    chequingAccount = result.chequingAccount;
    savingsAccount = result.savingsAccount;
    
    //validate username and password; if correct, redirect to bankAccount.hbs
    if (userObj[user] === password) {
        res.render('bankAccount', { user, chequingAccount, savingsAccount });
    } else if (!userObj[user]) {
        res.render('login', { message: "Not a registered username" });
    }
    else {
        res.render('login', { message: "Invalid password" });
    }
});

//render bank pages according to user's choice
app.post("/acct", async (req, res) => {
    var accountNumber = req.body.acct;
    const request = req.body.banking;
    const user = req.session.username;

    let chequingAccount, savingsAccount;
    const result = await getAcctDataFromDb(user);
    chequingAccount = result.chequingAccount;
    savingsAccount = result.savingsAccount;

    if (acctObj[accountNumber] && request === 'balance') {
        const accountType = acctObj[accountNumber].accountType;
        const accountBalance = acctObj[accountNumber].accountBalance;                        //render bankBalance.hbs if the acct # is valid and balance is selected
        res.render('bankBalance', { accountNumber, accountType, accountBalance });

    } else if (acctObj[accountNumber] && request === 'deposit') {                           //render bankDeposit.hbs if acct # and deposit is selected
        res.render('bankDeposit', { accountNumber });

    } else if (acctObj[accountNumber] && request === 'withdrawal') {                        //render bankWithdrawal.hbs if acct # and withdrawal is selected
        res.render('bankWithdrawal', { accountNumber });

    } else if (request === 'newacct') {                                                     //render openAccount.hbs if new account is selected
        res.render('openAccount', { chequingAccount, savingsAccount });
    }
});

//redirect bankBalance.hbs back to bankAccount.hbs
app.post("/balance", async (req, res) => {
    const user = req.session.username;

    let chequingAccount, savingsAccount;
    const result = await getAcctDataFromDb(user);
    chequingAccount = result.chequingAccount;
    savingsAccount = result.savingsAccount;

    res.render('bankAccount', { user, chequingAccount, savingsAccount });
});

//redirect bankDeposit.hbs back to login.hbs or bankAccount.hbs
app.post("/deposit", async (req, res) => {
    const btnrequest = req.body.btnsubmit;
    const accountNumber = req.body.txtaccountnumber;
    var depositAmount = req.body.amount;
    const user = req.session.username;

    let chequingAccount, savingsAccount;
    const result = await getAcctDataFromDb(user);
    chequingAccount = result.chequingAccount;
    savingsAccount = result.savingsAccount;

    if (btnrequest === 'deposit') {

        //take the account balance and add the deposit amount
        Object.assign(acctObj[accountNumber], { accountBalance: acctObj[accountNumber].accountBalance + +depositAmount });

        //update accounts.json 
        fs.writeFile("accounts.json", JSON.stringify(acctObj, null, 4), function (err) {
            if (err) throw err;
        });

        res.render('bankAccount', { user, chequingAccount, savingsAccount });

    } else {
        res.render('login', {});
        req.session.destroy();
    }
});

//redirect bankWithdrawal.hbs back to login.hbs or bankAccount.hbs
app.post("/withdrawal", async (req, res) => {

    const btnrequest = req.body.btnsubmit;
    const accountNumber = req.body.txtaccountnumber;
    var withdrawalAmount = req.body.amount;
    var balance = acctObj[accountNumber].accountBalance;
    const user = req.session.username;

    let chequingAccount, savingsAccount;
    const result = await getAcctDataFromDb(user);
    chequingAccount = result.chequingAccount;
    savingsAccount = result.savingsAccount;    

    if (btnrequest === 'withdrawal') {
        if (balance - +withdrawalAmount >= 0) {

            //take the account balance and subtract the withdrawal amount
            Object.assign(acctObj[accountNumber], { accountBalance: balance - +withdrawalAmount });

            //update accounts.json
            fs.writeFile("accounts.json", JSON.stringify(acctObj, null, 4), function (err) {
                if (err) throw err;
            });

            res.render('bankAccount', { user, chequingAccount, savingsAccount });
        } else {
            res.render('bankAccount', { user, chequingAccount, savingsAccount, message: `Insufficient Funds` });
        }
    } else {
        res.render('login', {});
        req.session.destroy();
    }
});

//redirect openAccount.hbs back to bankAccount.hbs
app.post("/newacct", async (req, res) => {
    const btnrequest = req.body.btnsubmit;
    const user = req.session.username;
    const accountType = req.body.accounttype;
    var lastAccountNumber = parseInt(acctObj.lastID);
    let chequingAccount, savingsAccount;
    const client = await MongoClient.connect(uri);
    const db = client.db('mongodatabase');
    const result = await db.collection("client").findOne({ Username: user });

    if (accountType === 'Chequing' && btnrequest === 'newacct') {
        var accountBalance = 0;
        lastAccountNumber = lastAccountNumber + 1;
        lastAccountNumber = lastAccountNumber.toString().padStart(7, '0');

        //update lastID key with new value
        acctObj.lastID = lastAccountNumber;

        //add a new key and values to accounts.json
        acctObj[lastAccountNumber] = { accountType: accountType, accountBalance: accountBalance };

        //update accounts.json
        fs.writeFile("accounts.json", JSON.stringify(acctObj, null, 4), function (err) {
            if (err) throw err;

        });

        const updateChequing = await db.collection("client").findOneAndUpdate(
            { Username: user },
            { $set:
                { Chequing: lastAccountNumber },
            },
            { returnOriginal: false }
        )

        const result = await db.collection("client").findOne({ Username: user });
        chequingAccount = result.Chequing;
        savingsAccount = result.Savings;
        
        res.render('bankAccount', { user, chequingAccount, savingsAccount, message: ` ${accountType} Account# ${lastAccountNumber} Created` });
    } else if (accountType === 'Savings' && btnrequest === 'newacct') {
        var accountBalance = 0;
        lastAccountNumber = lastAccountNumber + 1;
        lastAccountNumber = lastAccountNumber.toString().padStart(7, '0');

        //update lastID key with new value
        acctObj.lastID = lastAccountNumber;

        //add a new key and values to accounts.json
        acctObj[lastAccountNumber] = { accountType: accountType, accountBalance: accountBalance };

        //update accounts.json
        fs.writeFile("accounts.json", JSON.stringify(acctObj, null, 4), function (err) {
            if (err) throw err;
        });

        const updateSavings = await db.collection("client").findOneAndUpdate(
            { Username: user },
            { $set:
                { Savings: lastAccountNumber },
            },
            { returnOriginal: false }
        )

        const result = await db.collection("client").findOne({ Username: user });
        chequingAccount = result.Chequing;
        savingsAccount = result.Savings;
        
        res.render('bankAccount', { user, chequingAccount, savingsAccount, message: ` ${accountType} Account# ${lastAccountNumber} Created` });
    } else {
        chequingAccount = result.Chequing;
        savingsAccount = result.Savings;  

        res.render('bankAccount', { user, chequingAccount, savingsAccount });
    }
});

var server = app.listen(HTTP_PORT, function () {
    console.log("Listening on port " + HTTP_PORT);
});