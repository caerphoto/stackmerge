/*global postMessage, onmessage:true */
onmessage = function (message) {
    var file = message.data;
    // *Sync method only available in Workers.
    var reader = new FileReaderSync();
    var url = URL.createObjectURL(file);
    reader.readAsArrayBuffer(file);
    postMessage(url);
};
