var url = "http://localhost:3000";
var urlTTP = "http://localhost:4000";

var nonRepudio = angular.module('nonRepudio', ['ui.router']);

nonRepudio.controller("nonRepudioController", function ($scope, $http) {
    $scope.ver = 0;
    $scope.resA = 0;
    var keyPair;
    $scope.nonRepudiation = function () {
        $('#iconmsg').attr('class', 'glyphicon glyphicon-transfer');
        $('#iconmsg').attr('style', 'color:');
        $scope.resA = 1;
        $scope.resultA = 'Starts the communication between Client A - Client B & TTP...';
        $scope.resultB = 'Client A sends to Client B a POST:';
        keyPair = rsaInt.generateKeys(512);
        var e = keyPair.publicKey.e;
        var n = keyPair.publicKey.n;
        var d = keyPair.privateKey.d;
        var A = 'Client A';
        var B = 'Client B';
        var C = CryptoJS.AES.encrypt($scope.message.msg, $scope.message.secret);
        var originProbe = A + '|' + B + '|' + C;
        var originProbeHash = CryptoJS.SHA256(originProbe);
        originProbeHash= bigInt(originProbeHash.toString(),16);
        originProbe = originProbeHash.modPow(d,n);
        var uncrypted = originProbe.modPow(e,n);
        var data = {
            A: 'Client A',
            B: 'Client B',
            C: C.toString(),
            originProbe: originProbe.toString(),
            eClient: e.toString(),
            nClient: n.toString()
        };
        $scope.resultBa = data.A;
        $scope.resultBb = data.B;
        $scope.resultBc = data.C;
        $scope.resultBo = data.originProbe;
        console.log('');
        console.log('***************************** data *******************************');
        console.log(data);
        console.log('******************************************************************');
        console.log('');
        $scope.message.proofOrigin = originProbe;
        $scope.message.crypted = C.toString();
        console.log('');
        console.log('');
        console.log('##################################################################');
        console.log('              POST http://localhost:3000/nonRepudio');
        console.log('##################################################################');
        console.log('');
        console.log('');
        $http.post(url + '/nonRepudio', {data: data})
            .then(function (res) {
                console.log('');
                console.log('****************************** res *******************************');
                console.log(res);
                console.log('******************************************************************');
                console.log('');
                compareHash(res.data.data, function () {
                    var A = 'Client A';
                    var B = 'Client B';
                    var TTP = 'TTP';
                    var K = $scope.message.secret;
                    var concat = A + '|' + TTP + '|' + B + '|' + K;
                    var hash = CryptoJS.SHA256(concat);
                    hash = bigInt(hash.toString(),16);
                    var originProofOfK = hash.modPow(d,n);
                    var data = {
                        A: A,
                        TTP: TTP,
                        B: B,
                        K: K,
                        originProofOfK: originProofOfK.toString(),
                        eClient: e.toString(),
                        nClient: n.toString()
                    };
                    console.log('');
                    console.log('');
                    console.log('##################################################################');
                    console.log('               POST http://localhost:4000/TTP');
                    console.log('##################################################################');
                    console.log('');
                    console.log('');
                    $http.post(urlTTP +'/TTP', {data: data})
                        .then(function (res) {
                            console.log('');
                            console.log('******************************************************************');
                            console.log('                       response from TTP');
                            console.log('******************************************************************');
                            console.log('');
                            console.log('************************* res.data.data **************************');
                            console.log(res.data);
                            console.log('******************************************************************');
                            console.log('');
                            compareHashTTP(res.data.data, function () {
                                sleep(1000);
                                $('#iconmsg').attr('class', 'glyphicon glyphicon-ok');
                                $('#iconmsg').attr('style', 'color:#419641');
                                console.log('');
                                console.log('******************************************************************');
                                console.log('|================================================================|');
                                console.log('|                                                                |');
                                console.log('|               >> Protocolo Non Repudio OK <<                   |');
                                console.log('|                                                                |');
                                console.log('|================================================================|');
                                console.log('******************************************************************');
                                return;
                            })
                    })
            });
        })
    }

    function compareHash(info, control) {
        console.log('');
        console.log('******************************************************************');
        console.log('                   Comparación de hashes');
        console.log('******************************************************************');
        console.log('');
        var concat = info.B + '|' + info.A + '|' + info.C;
        console.log('*************************** info.eSer ****************************');
        console.log('info.eSer',info.eServer);
        console.log('******************************************************************');
        console.log('');
        console.log('*************************** info.nSer ****************************');
        console.log('info.nSer',info.nServer);
        console.log('******************************************************************');
        console.log('');
        //debugger;
        var eS = bigInt(info.eServer);
        var nS = bigInt(info.nServer);
        var originHash = CryptoJS.SHA256(concat).toString();
        var originServer = bigInt(info.receptionProbe);
        console.log('');
        console.log('******************************************************************');
        console.log('                bigInt of info.eServer & nServer ');
        console.log('******************************************************************');
        console.log('');
        console.log('');
        console.log('***************************** eSer *******************************');
        console.log('eS',eS);
        console.log('******************************************************************');
        console.log('');
        console.log('***************************** nSer *******************************');
        console.log('nS',nS);
        console.log('******************************************************************');
        console.log('');
        //debugger;
        var decrypted = originServer.modPow(eS,nS).toString(16);
        //debugger;
        if(decrypted.localeCompare(originHash)==0){
            console.log('');
            console.log('******************************************************************');
            console.log('         SI Coinciden los hashes de Proof of reception');
            console.log('******************************************************************');
            console.log('');
            console.log('*************************** decrypted ****************************');
            console.log(decrypted.toString(16));
            console.log('******************************************************************');
            console.log('');
            console.log('*************************** originHash ***************************');
            console.log(originHash.toString(16));
            console.log('******************************************************************');
            console.log('');
            control();
        }
        else{
            sleep(1000);
            $('#iconmsg').attr('class', 'glyphicon glyphicon-remove');
            $('#iconmsg').attr('style', 'color:red');
            console.log('');
            console.log('******************************************************************');
            console.log('         NO Coinciden los hashes de Proof of reception');
            console.log('******************************************************************');
            console.log('');
        }
    }
    function compareHashTTP(info, control) {
        var concat = info.TTP + '|' + info.A + '|' + info.B+ '|' + info.K;
        var eTTP = bigInt(info.eTTP);
        var nTTP = bigInt(info.nTTP);
        var originHash = CryptoJS.SHA256(concat).toString();
        var originServer = bigInt(info.proofPublication);
        var decrypted = originServer.modPow(eTTP,nTTP).toString(16);
        if(decrypted.localeCompare(originHash)==0){
            console.log('');
            console.log('******************************************************************');
            console.log('       SI Coinciden los hashes de Proof of publication of K');
            console.log('******************************************************************');
            console.log('');
            console.log('*************************** decrypted ****************************');
            console.log(decrypted.toString(16));
            console.log('******************************************************************');
            console.log('');
            console.log('*************************** originHash ***************************');
            console.log(originHash.toString(16));
            console.log('******************************************************************');
            console.log('');
            control();
        }
        else{
            sleep(1000);
            $('#iconmsg').attr('class', 'glyphicon glyphicon-remove');
            $('#iconmsg').attr('style', 'color:red');
            console.log('');
            console.log('******************************************************************');
            console.log('       NO Coinciden los hashes de Proof of publication of K');
            console.log('******************************************************************');
            console.log('');
        }
    }

    $scope.hideA = function(){
        $scope.resA = 0;
    }

    $scope.showA = function(){
        $scope.resA = 1;
    }

    $scope.verPassword = function(){
        $scope.ver = 1;
        $('#contrasena').attr('type', 'text');
        $('#iconlock').attr('class', 'glyphicon glyphicon-eye-open');
        $('#iconlock').attr('style', 'color:#3B9AE4');
    }
    
    $scope.ocultarPassword = function(){
        $scope.ver = 0;
        $('#contrasena').attr('type', 'password');
        $('#iconlock').attr('class', 'glyphicon glyphicon-lock');
        $('#iconlock').attr('style', 'color:');
    }

    function sleep(milliseconds) {
      var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
          break;
        }
      }
    }

    // $(document).ready(function () {
    //     $('#mostrar_contrasena').click(function () {
    //       if ($('#mostrar_contrasena').is(':checked')) {
    //         $('#contrasena').attr('type', 'text');
    //       } else {
    //         $('#contrasena').attr('type', 'password');
    //       }
    //     });
    // });
});
