/*global postMessage, onmessage:true */
// Loads the File in the background then passes back an object URL to it.
onmessage = function (message) {
    var file = message.data;
    var reader = new FileReader();
    reader.onloadend = function () {
        var url = URL.createObjectURL(file);
        postMessage(url);
    };

    reader.readAsArrayBuffer(file);
};
