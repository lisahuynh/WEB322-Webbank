const Handlebars = require("handlebars");

    function newAccountDisabled() {
        Handlebars.registerHelper('newAcctDisabled', function () {
            const chequingAccount = arguments[0];
            const savingsAccount = arguments[1];
            const options = arguments[2];
            if (chequingAccount && savingsAccount) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
    }

    function noAccountDisabled() {
        Handlebars.registerHelper('noAcctDisabled', function () {
            const chequingAccount = arguments[0];
            const savingsAccount = arguments[1];
            const options = arguments[2];
            if (!chequingAccount && !savingsAccount) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
    }

    function checked() {
        Handlebars.registerHelper('checked', function checked() {
            const chequingAccount = arguments[0];
            const savingsAccount = arguments[1];
            const options = arguments[2];
            if (!chequingAccount || !savingsAccount) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
    }

exports.newAccountDisabled = newAccountDisabled;
exports.noAccountDisabled = noAccountDisabled;
exports.checked = checked;