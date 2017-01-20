var express = require('express');
var router = express.Router();
var CryptoJS = require("crypto-js");
var bignum = require('bignum');
var rsa = require('./rsa');
var request = require("request");
var C;
var keys = rsa.generateKeys(512);
var cipherText;

router.post('/nonRepudio', function (req, res) {
    console.log('');
    console.log('');
    console.log('##################################################################');
    console.log('                         POST /nonRep');
    console.log('##################################################################');
    console.log('');
    console.log('************************* From Client A **************************');
    console.log('');
    console.log('*************************** req.body *****************************');
    console.log(req.body);
    console.log('******************************************************************');
    console.log('');
    compareHashes(req.body.data, function () {
        var B = 'Client B';
        var A = 'Client A';
        var C = req.body.data.C;
        cipherText = C;
        var receptionProbe = B + '|' + A + '|' + C;
        var recHash = CryptoJS.SHA256(receptionProbe);
        recHash = bignum(recHash.toString(),16);
        receptionProbe = recHash.powm(keys.privateKey.d, keys.publicKey.n);
        console.log('');
        console.log('************************** receptionProbe ************************');
        console.log(receptionProbe);
        console.log('******************************************************************');
        console.log('');
        var data = {
            B: B,
            A: A,
            C: C,
            receptionProbe: receptionProbe.toString(),
            eServer: keys.publicKey.e.toString(),
            nServer: keys.publicKey.n.toString()
        };
        console.log('****************************** data ******************************');
        console.log(data);
        console.log('******************************************************************');
        console.log('');
        res.status(200).send({data: data});
    });

    router.post('/publicationProof', function (req, res) {
        console.log('');
        console.log('');
        console.log('##################################################################');
        console.log('                   POST /publicationProof');
        console.log('##################################################################');
        console.log('');
        console.log('************************** To Client A ***************************');
        console.log('');
        compareHashesTTP(req.body, function () {
            var K = req.body.K;
            var bytes = CryptoJS.AES.decrypt(cipherText, K);
            console.log('');
            console.log('******************************************************************');
            console.log('         **CryptoJS.AES.decrypt(cipherText, K)**');
            console.log('**************************** bytes *******************************');
            console.log(bytes);
            console.log('******************************************************************');
            var plaintext = bytes.toString(CryptoJS.enc.Utf8);
            console.log('');
            console.log('');
            console.log('==================================================================');
            console.log('******************************************************************');
            console.log('');
            console.log('  >> Msg: '+plaintext);
            console.log('');
            console.log('******************************************************************');
            console.log('==================================================================');
            console.log('');
            console.log('');
            res.status(200).send('OK');
        })
    });

    function compareHashesTTP(info, control) {
        var concat = info.TTP + '|' + info.A + '|' + info.B + '|' + info.K;
        var eTTP = bignum(info.eTTP);
        var nTTP = bignum(info.nTTP);
        var originHash = CryptoJS.SHA256(concat).toString();
        var originC = bignum(info.proofPublication);
        var decrypted = originC.powm(eTTP,nTTP).toString(16);
        if(decrypted.localeCompare(originHash)==0){
            console.log('');
            console.log('******************************************************************');
            console.log('      SI Coinciden los hashes de Proof of publication of K!');
            console.log('******************************************************************');
            console.log('');
            console.log('************************** decrypted *****************************');
            console.log(decrypted.toString(16));
            console.log('******************************************************************');
            console.log('');
            console.log('*************************** originHash ***************************');
            console.log(originHash.toString(16));
            console.log('******************************************************************');
            console.log('');
            control();
        }
        else {
            console.log('');
            console.log('******************************************************************');
            console.log('       NO Coinciden los hashes de Proof of publication of K!');
            console.log('******************************************************************');
            console.log('');
        }
    }


});

function compareHashes(info, control) {
    var concat = info.A + '|' + info.B + '|' + info.C;
    var eC = bignum(info.eClient);
    var nC= bignum(info.nClient);
    var originHash = CryptoJS.SHA256(concat).toString();
    var originC = bignum(info.originProbe);
    var decrypted = originC.powm(eC,nC).toString(16);
    if(decrypted.localeCompare(originHash)==0){
        console.log('');
        console.log('******************************************************************');
        console.log('         SI Coinciden los hashes de Proof of origin!');
        console.log('******************************************************************');
        console.log('');
        console.log('************************** decrypted *****************************');
        console.log(decrypted.toString(16));
        console.log('******************************************************************');
        console.log('');
        console.log('************************** originHash ****************************');
        console.log(originHash.toString(16));
        console.log('******************************************************************');
        console.log('');
        control();
    }
    else {
        console.log('');
        console.log('******************************************************************');
        console.log('         NO Coinciden los hashes de Proof of origin!');
        console.log('******************************************************************');
        console.log('');
    }
}

module.exports = router;