function fLogout() {

    document.getElementById("userLogout").onclick = function () {
        location.href = "https://web322-webbank.fly.dev/login";
    };
}

function fSelectBankingOption() {
    if (document.getElementById("openAcct").checked)
        document.getElementById("acct").disabled = true;
    else
        document.getElementById("acct").disabled = false;

    if (document.getElementById("balance").checked ||
    document.getElementById("deposit").checked ||
    document.getElementById("openAcct").checked ||
    document.getElementById("withdrawal").checked)
    document.getElementById("btnsubmit").disabled = false;
}

function fSelectOpenAccountOption() {

    if (document.getElementById("newchequing").checked ||
        document.getElementById("newsavings").checked)
        document.getElementById("btnsubmit").disabled = false;
}