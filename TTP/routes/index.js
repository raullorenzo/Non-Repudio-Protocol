var url = "http://localhost:3000";
var express = require('express');
var router = express.Router();
var CryptoJS = require("crypto-js");
var rsa = require('./rsa');
var keys = rsa.generateKeys(512);
var http = require('http');
var bignum = require('bignum');
var request = require('request');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

router.post('/TTP', function (req, res) {
    console.log('');
    console.log('');
    console.log('##################################################################');
    console.log('                           POST /TTP');
    console.log('##################################################################');
    console.log('');
    console.log('************************* From Client A **************************');
    console.log('');
    console.log('*************************** req.body *****************************');
    console.log(req.body);
    console.log('******************************************************************');
    console.log('');
    compareHash(req.body.data, function () {
        var A = 'Client A';
        var B = 'Client B';
        var K = req.body.data.K;
        var TTP = 'TTP';
        var concat = TTP+'|'+A+'|'+B+'|'+K;
        var concatHash = CryptoJS.SHA256(concat);
        concatHash = bignum(concatHash.toString(),16);
        var proofOfPublicationK = concatHash.powm(keys.privateKey.d, keys.publicKey.n);
        var data={
            TTP: TTP,
            A: A,
            B: B,
            K: K,
            proofPublication: proofOfPublicationK.toString(),
            eTTP: keys.publicKey.e.toString(),
            nTTP: keys.publicKey.n.toString()
        };console.log('');
        console.log('******************************* data *****************************');
        console.log(data);
        console.log('******************************************************************');
        console.log('');
        res.status(200).send({data:data});
        console.log('');
        console.log('');
        console.log('##################################################################');
        console.log('         POST http://localhost:3000/publicationProof');
        console.log('##################################################################');
        console.log('');
        console.log('');
        request({
            uri: url + "/publicationProof",
            method: "POST",
            form: data
        }, function(error, response, body) {
            if(error == null){
                console.log('');
                console.log('************************* From Client B **************************');
                console.log('==================================================================');
                console.log('|                                                                |');
                console.log('|                        status 200 - OK                         |');
                console.log('|                                                                |');
                console.log('==================================================================');
                console.log('******************************************************************');
                console.log('');
            } else{
                console.log('');
                console.log('*************************** From Client B ************************');
                console.log('');
                console.log(error);
                console.log('');
                console.log('******************************************************************');
                console.log('');
            }
        });
    });
    function compareHash(info, control) {
        var concat = info.A + '|' + info.TTP + '|' + info.B +'|' + info.K;
        var eC = bignum(info.eClient);
        var nC= bignum(info.nClient);
        var originHash = CryptoJS.SHA256(concat).toString();
        var originServer = bignum(info.originProofOfK);
        var decrypted = originServer.powm(eC,nC).toString(16);
        if(decrypted.localeCompare(originHash)==0){
            console.log('');
            console.log('******************************************************************');
            console.log('          SI Coinciden los hashes de Proof of origin of K!');
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
        else{
            console.log('');
            console.log('******************************************************************');
            console.log('           NO Coinciden los hashes de Proof of origin of K!');
            console.log('******************************************************************');
            console.log('');
        }  
    }
});

module.exports = router;